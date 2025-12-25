import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP"
});
app.use(limiter);

const JWT_SECRET = process.env.JWT_SECRET;

const PORT = process.env.PORT || 3001;
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

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

app.get("/", (_request, response) => response.status(200).send("OK"));

app.post("/api/register", async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = {
      email,
      username,
      password: hashedPassword,
      createdAt: new Date(),
      isActive: true
    };

    const result = await usersCollection.insertOne(newUser);
    
    const token = jwt.sign(
      { userId: result.insertedId, email, username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: { id: result.insertedId, email, username }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, email: user.email, username: user.username }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/me", authenticateToken, async (req, res) => {
  try {
    const user = await usersCollection.findOne(
      { _id: req.user.userId },
      { projection: { password: 0 } }
    );
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user data" });
  }
});

app.post("/event", authenticateToken, async (request, response) => {
	const event = request.body;
	if (!event?.session_id || !event?.type || !event?.target) {
		return response.status(400).end();
	}

	try {
		event.timestamp = new Date();
		await eventsCollection.insertOne(event);
		response.status(204).end();
	} catch (error) {
		console.error("Failed to save event:", error);
		response.status(500).end();
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
	const sessionId = request.query.session_id;

	try {
		const events = await eventsCollection.find({ session_id: sessionId }).toArray();
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

app.post("/api/chat", authenticateToken, async (request, response) => {
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

app.delete("/reset", authenticateToken, async (_request, response) => {
	try {
		await eventsCollection.deleteMany({});
		response.status(200).json({ message: "Database cleared." });
	} catch (error) {
		console.error("Failed to clear database:", error);
		response.status(500).json({ error: "Failed to clear database" });
	}
});

connectToDatabase().then(() => {
	app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
