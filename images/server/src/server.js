import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import { hashPassword, comparePassword, generateToken, verifyToken } from "./auth.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/brokerdb";
const MODEL = "llama3";

let db;
let eventsCollection;
let usersCollection;

async function connectToDatabase() {
	try {
		const client = new MongoClient(MONGODB_URL);
		await client.connect();
		db = client.db();
		eventsCollection = db.collection("events");
		usersCollection = db.collection("users");
		console.log("Connected to MongoDB");
	} catch (error) {
		console.error("Failed to connect to MongoDB:", error);
		process.exit(1);
	}
}

const authenticateToken = (req, res, next) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return res.status(401).json({ error: 'Access token required' });
	}

	try {
		const decoded = verifyToken(token);
		req.userId = decoded.userId;
		next();
	} catch (error) {
		return res.status(403).json({ error: 'Invalid or expired token' });
	}
};

app.post("/api/auth/register", async (req, res) => {
	const { username, email, password } = req.body;

	if (!username || !email || !password) {
		return res.status(400).json({ error: 'Username, email, and password required' });
	}

	if (password.length < 6) {
		return res.status(400).json({ error: 'Password must be at least 6 characters' });
	}

	try {
		const existingUser = await usersCollection.findOne({ 
			$or: [{ email }, { username }] 
		});

		if (existingUser) {
			return res.status(400).json({ error: 'User already exists' });
		}

		const hashedPassword = await hashPassword(password);
		const result = await usersCollection.insertOne({
			username,
			email,
			password: hashedPassword,
			createdAt: new Date()
		});

		const token = generateToken(result.insertedId);

		res.status(201).json({
			message: 'User created successfully',
			token,
			user: {
				id: result.insertedId,
				username,
				email
			}
		});
	} catch (error) {
		console.error('Registration error:', error);
		res.status(500).json({ error: 'Failed to create user' });
	}
});

app.post("/api/auth/login", async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ error: 'Email and password required' });
	}

	try {
		const user = await usersCollection.findOne({ email });

		if (!user) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const isValidPassword = await comparePassword(password, user.password);

		if (!isValidPassword) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const token = generateToken(user._id);

		res.json({
			message: 'Login successful',
			token,
			user: {
				id: user._id,
				username: user.username,
				email: user.email
			}
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({ error: 'Failed to login' });
	}
});

app.get("/api/auth/profile", authenticateToken, async (req, res) => {
	try {
		const user = await usersCollection.findOne({ _id: new ObjectId(req.userId) });

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		res.json({
			user: {
				id: user._id,
				username: user.username,
				email: user.email,
				createdAt: user.createdAt,
				profile: user.profile,
				profileUpdatedAt: user.profile_updated_at
			}
		});
	} catch (error) {
		console.error('Profile error:', error);
		res.status(500).json({ error: 'Failed to fetch profile' });
	}
});

app.get("/", (_request, response) => response.status(200).send("OK"));

app.post("/event", authenticateToken, async (request, response) => {
	const event = request.body;
	if (!event?.type || !event?.target) {
		return response.status(400).json({ error: 'Event type and target required' });
	}

	try {
		event.user_id = new ObjectId(request.userId);
		event.timestamp = new Date();
		await eventsCollection.insertOne(event);
		response.status(201).json({ message: 'Event saved successfully' });
	} catch (error) {
		console.error("Failed to save event:", error);
		response.status(500).json({ error: 'Failed to save event' });
	}
});

function buildFeatures(events) {
	const clicks = (target) => events.filter((event) => event.type === "click" && event.target === target).length;
	const hovers = (target) =>
		events.filter((event) => event.type === "hover" && event.target === target).map((event) => event.hover_ms || 0);
	const average = (array) => (array.length ? array.reduce((sum, value) => sum + value, 0) / array.length : 0);
	const percentile95 = (array) => {
		if (!array.length) return 0;
		const sorted = [...array].sort((a, b) => a - b);
		return sorted[Math.floor(0.95 * (sorted.length - 1))];
	};

	const hoverStatsBuy = hovers("buy");
	const hoverStatsSell = hovers("sell");

	return {
		number_of_clicks_buy: clicks("buy"),
		number_of_clicks_sell: clicks("sell"),
		average_hover_buy_duration: Math.round(average(hoverStatsBuy)),
		average_hover_sell_duration: Math.round(average(hoverStatsSell)),
		percentile95_hover_buy_duration: Math.round(percentile95(hoverStatsBuy)),
		percentile95_hover_sell_duration: Math.round(percentile95(hoverStatsSell)),
	};
}

app.get("/profile", authenticateToken, async (request, response) => {
	try {
		const events = await eventsCollection.find({ user_id: new ObjectId(request.userId) }).toArray();
		const features = buildFeatures(events);

		const systemPrompt = "You are a classifier. Output ONLY valid JSON per schema. No prose.";
		const groups = ["Cautious", "Balanced", "Opportunistic", "Impulsive", "Exploratory"];
		const userPrompt = `
 Classify the user into one of ${JSON.stringify(groups)} using ONLY these FEATURES.
 If uncertain, choose "Balanced".
 Schema: {"profile_type": string, "confidence": number, "signals": [string]}
 FEATURES:
 ${JSON.stringify(features)}
 Return compact JSON only.`.trim();

		try {
			const ollamaResponse = await fetch(`${OLLAMA_URL}/api/generate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					model: MODEL,
					prompt: `System:\n${systemPrompt}\n\nUser:\n${userPrompt}`,
					stream: false,
					options: { temperature: 0.2 },
				}),
			});

			const data = await ollamaResponse.json();

			let profile;
			try {
				profile = JSON.parse(data.response);
			} catch {
				profile = {
					profile_type: "Balanced",
					confidence: 0.5,
					signals: ["fallback parse"],
				};
			}

			// Save profile to database
			try {
				await usersCollection.updateOne(
					{ _id: new ObjectId(request.userId) },
					{ 
						$set: { 
							profile: profile,
							profile_updated_at: new Date()
						}
					}
				);
			} catch (saveError) {
				console.error("Failed to save profile:", saveError);
			}

			response.json({ features, profile });
		} catch (error) {
			console.error("Profile generation error:", error);
			response.json({
				features,
				profile: {
					profile_type: "Balanced",
					confidence: 0.5,
					signals: ["ollama error"],
				},
			});
		}
	} catch (error) {
		console.error("Failed to build profile:", error);
		response.status(500).json({ error: "Failed to build profile" });
	}
});

app.post("/api/chat", async (request, response) => {
	try {
		const prompt = request.body.prompt ?? "";
		const ollamaResponse = await fetch(`${OLLAMA_URL}/api/generate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ model: MODEL, prompt, stream: false }),
		});

		const data = await ollamaResponse.json();
		response.send(data.response || "No response generated");
	} catch {
		response.status(500).json({ error: "Failed to connect to Ollama" });
	}
});

app.delete("/reset", authenticateToken, async (request, response) => {
	try {
		await eventsCollection.deleteMany({ user_id: new ObjectId(request.userId) });
		response.status(200).json({ message: "Your data cleared successfully." });
	} catch (error) {
		console.error("Failed to clear user data:", error);
		response.status(500).json({ error: "Failed to clear data" });
	}
});

let lastPrice = 100;
let priceHistory = [];

function generateInitialPrices() {
	const initialPrice = 100;
	lastPrice = initialPrice;
	priceHistory = [{
		price: initialPrice,
		timestamp: new Date(Date.now() - 19 * 30000).toISOString()
	}];
	
	for (let i = 1; i < 20; i++) {
		const maxChangePercent = 0.05;
		const change = (Math.random() - 0.5) * 2 * maxChangePercent;
		const newPrice = lastPrice * (1 + change);
		lastPrice = Number(newPrice.toFixed(2));
		
		priceHistory.push({
			price: lastPrice,
			timestamp: new Date(Date.now() - (19 - i) * 30000).toISOString()
		});
	}
}

function randomPrice() {
	const maxChangePercent = 0.05;
	const change = (Math.random() - 0.5) * 2 * maxChangePercent;
	const newPrice = lastPrice * (1 + change);
	lastPrice = Number(newPrice.toFixed(2));
	
	const newPricePoint = {
		price: lastPrice,
		timestamp: new Date().toISOString()
	};
	
	priceHistory.push(newPricePoint);
	if (priceHistory.length > 50) {
		priceHistory = priceHistory.slice(-50);
	}
	
	return lastPrice;
}

app.get("/price", (_req, res) => {
	const price = randomPrice();
	const timestamp = new Date().toISOString();
	res.json({ price, timestamp, history: priceHistory });
});

connectToDatabase().then(() => {
	generateInitialPrices();
	console.log(`Generated ${priceHistory.length} initial price points`);
	app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});