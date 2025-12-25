import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import { hashPassword, comparePassword, generateToken, verifyToken } from "./auth.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/brokerdb";
const MODEL = "llama3.2:1b";

let db;
let eventsCollection;
let usersCollection;
let sessionsCollection;

async function connectToDatabase() {
	try {
		const client = new MongoClient(MONGODB_URL);
		await client.connect();
		db = client.db();
		eventsCollection = db.collection("events");
		usersCollection = db.collection("users");
		sessionsCollection = db.collection("sessions");
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

app.post("/api/auth/register", async (req, res) => {
	const { username, email, password } = req.body;

	if (!username || !email || !password) {
		return res.status(400).json({ error: "Username, email, and password required" });
	}

	if (password.length < 6) {
		return res.status(400).json({ error: "Password must be at least 6 characters" });
	}

	try {
		const existingUser = await usersCollection.findOne({
			$or: [{ email }, { username }],
		});

		if (existingUser) {
			return res.status(400).json({ error: "User already exists" });
		}

		const hashedPassword = await hashPassword(password);
		const result = await usersCollection.insertOne({
			username,
			email,
			password: hashedPassword,
			createdAt: new Date(),
		});

		const token = generateToken(result.insertedId);

		res.status(201).json({
			message: "User created successfully",
			token,
			user: {
				id: result.insertedId,
				username,
				email,
			},
		});
	} catch (error) {
		console.error("Registration error:", error);
		res.status(500).json({ error: "Failed to create user" });
	}
});

app.post("/api/auth/login", async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ error: "Email and password required" });
	}

	try {
		const user = await usersCollection.findOne({ email });

		if (!user) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		const isValidPassword = await comparePassword(password, user.password);

		if (!isValidPassword) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		const token = generateToken(user._id);

		res.json({
			message: "Login successful",
			token,
			user: {
				id: user._id,
				username: user.username,
				email: user.email,
			},
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ error: "Failed to login" });
	}
});

app.get("/api/auth/profile", authenticateToken, async (req, res) => {
	try {
		const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		res.json({
			user: {
				id: user._id,
				username: user.username,
				email: user.email,
				createdAt: user.createdAt,
				profile: user.profile,
				profileUpdatedAt: user.profile_updated_at,
			},
		});
	} catch (error) {
		console.error("Profile error:", error);
		res.status(500).json({ error: "Failed to fetch profile" });
	}
});

app.post("/session-event", authenticateToken, async (request, response) => {
	const sessionEvent = request.body;
	if (!sessionEvent?.type) {
		return response.status(400).json({ error: "Session event type required" });
	}

	try {
		const userId = new ObjectId(request.user.userId);
		sessionEvent.user_id = userId;
		sessionEvent.timestamp = new Date(sessionEvent.timestamp || Date.now());

		// Insert session event
		await sessionsCollection.insertOne(sessionEvent);

		// For session_start, also create/update session summary
		if (sessionEvent.type === 'session_start' && sessionEvent.session_id) {
			console.log("Creating session summary for:", sessionEvent.session_id);
			
			const result = await sessionsCollection.updateOne(
				{ 
					user_id: userId, 
					session_id: sessionEvent.session_id,
					type: 'session_summary' 
				},
				{
					$set: {
						user_id: userId,
						session_id: sessionEvent.session_id,
						type: 'session_summary',
						start_time: sessionEvent.timestamp,
						user_agent: sessionEvent.user_agent,
						start_timestamp: sessionEvent.timestamp,
						last_activity: sessionEvent.timestamp,
						events_count: 0,
						clicks_buy: 0,
						clicks_sell: 0,
						hovers_buy: [],
						hovers_sell: []
					}
				},
				{ upsert: true }
			);
			
			console.log("Session summary update result:", result);
		}

		// For session_end, update session summary
		if (sessionEvent.type === 'session_end' && sessionEvent.session_id) {
			await sessionsCollection.updateOne(
				{ 
					user_id: userId, 
					session_id: sessionEvent.session_id,
					type: 'session_summary' 
				},
				{
					$set: {
						end_time: sessionEvent.timestamp,
						duration_ms: sessionEvent.total_session_duration,
						completed: true
					}
				}
			);
		}

		response.status(201).json({ message: "Session event saved successfully" });
	} catch (error) {
		console.error("Failed to save session event:", error);
		response.status(500).json({ error: "Failed to save session event" });
	}
});

// Get all session summaries for a user
app.get("/api/sessions", authenticateToken, async (request, response) => {
	try {
		const sessions = await sessionsCollection.find({ 
			user_id: new ObjectId(request.user.userId),
			type: 'session_summary'
		}).sort({ start_time: -1 }).toArray();
		
		response.json(sessions);
	} catch (error) {
		console.error("Failed to fetch sessions:", error);
		response.status(500).json({ error: "Failed to fetch sessions" });
	}
});

// Get events for a specific session
app.get("/api/sessions/:sessionId/events", authenticateToken, async (request, response) => {
	try {
		const { sessionId } = request.params;
		const events = await eventsCollection.find({ 
			user_id: new ObjectId(request.user.userId),
			session_id: sessionId 
		}).sort({ timestamp: 1 }).toArray();
		
		response.json(events);
	} catch (error) {
		console.error("Failed to fetch session events:", error);
		response.status(500).json({ error: "Failed to fetch session events" });
	}
});

app.get("/", (_request, response) => response.status(200).send("OK"));

app.post("/event", authenticateToken, async (request, response) => {
	const event = request.body;
	if (!event?.session_id || !event?.type || !event?.target) {
		return response.status(400).end();
	}

	try {
		const userId = new ObjectId(request.user.userId);
		event.user_id = userId;
		event.timestamp = new Date();
		
		// Insert the event
		await eventsCollection.insertOne(event);

		// Update session summary with event data
		if (event.session_id && event.session_id !== "unknown-session") {
			const updateData = {
				$set: { last_activity: new Date() },
				$inc: { events_count: 1 }
			};

			// Update specific counters based on event type and target
			if (event.type === 'click') {
				if (event.target === 'buy') {
					updateData.$inc.clicks_buy = 1;
				} else if (event.target === 'sell') {
					updateData.$inc.clicks_sell = 1;
				}
			} else if (event.type === 'hover' && event.hover_ms) {
				if (event.target === 'buy') {
					updateData.$push = { hovers_buy: event.hover_ms };
				} else if (event.target === 'sell') {
					updateData.$push = { hovers_sell: event.hover_ms };
				}
			}

			await sessionsCollection.updateOne(
				{ 
					user_id: userId, 
					session_id: event.session_id,
					type: 'session_summary' 
				},
				updateData
			);
		}

		response.status(201).json({ message: "Event saved successfully" });
	} catch (error) {
		console.error("Failed to save event:", error);
		response.status(500).json({ error: "Failed to save event" });
	}
});

function buildFeatures(events, sessions) {
	// Get all session summaries and fallback to session_start events if no summaries
	const sessionSummaries = sessions.filter(s => s.type === 'session_summary');
	const sessionStarts = sessions.filter((s) => s.type === "session_start");
	const sessionEnds = sessions.filter((s) => s.type === "session_end");
	
	console.log("Session summaries found:", sessionSummaries.length);
	console.log("Session starts found:", sessionStarts.length);
	console.log("Session ends found:", sessionEnds.length);

	// Calculate clicks from both events and session summaries
	const clicksFromEvents = (target) => events.filter((event) => event.type === "click" && event.target === target).length;
	const clicksFromSessions = (target) => sessionSummaries.reduce((sum, session) => 
		sum + (target === 'buy' ? (session.clicks_buy || 0) : (session.clicks_sell || 0)), 0);

	// Calculate hovers from both events and session summaries  
	const hoversFromEvents = (target) =>
		events.filter((event) => event.type === "hover" && event.target === target).map((event) => event.hover_ms || 0);
	const hoversFromSessions = (target) => 
		sessionSummaries.flatMap(session => target === 'buy' ? (session.hovers_buy || []) : (session.hovers_sell || []));

	const totalClicksBuy = clicksFromEvents("buy") + clicksFromSessions("buy");
	const totalClicksSell = clicksFromEvents("sell") + clicksFromSessions("sell");
	
	const allHoverBuy = [...hoversFromEvents("buy"), ...hoversFromSessions("buy")];
	const allHoverSell = [...hoversFromEvents("sell"), ...hoversFromSessions("sell")];

	const average = (array) => (array.length ? array.reduce((sum, value) => sum + value, 0) / array.length : 0);
	const percentile95 = (array) => {
		if (!array.length) return 0;
		const sorted = [...array].sort((a, b) => a - b);
		return sorted[Math.floor(0.95 * (sorted.length - 1))];
	};

	// Session duration calculations
	const completedSessions = sessionSummaries.filter(s => s.completed && s.duration_ms);
	const avgSessionDuration = completedSessions.length > 0 ? 
		average(completedSessions.map(s => s.duration_ms)) : 0;

	// Activity time analysis
	const timeOfDayHours = sessionStarts.map((s) => {
		const hour = new Date(s.timestamp).getHours();
		return hour;
	});
	const peakHour = timeOfDayHours.length > 0 ? getMostFrequent(timeOfDayHours) : null;

	// Device and browser analysis from session summaries or session starts
	const sourceSessions = sessionSummaries.length > 0 ? sessionSummaries : sessionStarts;
	const userAgents = sourceSessions.map(s => s.user_agent).filter(Boolean);
	console.log("User agents found:", userAgents.length);
	
	const deviceStats = userAgents.reduce((acc, ua) => {
		const device = ua?.device || "unknown";
		acc[device] = (acc[device] || 0) + 1;
		return acc;
	}, {});

	const browserStats = userAgents.reduce((acc, ua) => {
		const browser = ua?.browser?.browser || ua?.full_ua?.split(' ')[0] || "unknown";
		acc[browser] = (acc[browser] || 0) + 1;
		return acc;
	}, {});

	return {
		number_of_clicks_buy: totalClicksBuy,
		number_of_clicks_sell: totalClicksSell,
		average_hover_buy_duration: Math.round(average(allHoverBuy)),
		average_hover_sell_duration: Math.round(average(allHoverSell)),
		percentile95_hover_buy_duration: Math.round(percentile95(allHoverBuy)),
		percentile95_hover_sell_duration: Math.round(percentile95(allHoverSell)),
		average_session_duration_ms: Math.round(avgSessionDuration),
		peak_activity_hour: peakHour,
		total_sessions: sessionStarts.length,
		primary_device: getMostFrequent(
			Object.keys(deviceStats)
				.map((k) => k)
				.filter((k) => deviceStats[k] > 0)
		),
		primary_browser: getMostFrequent(
			Object.keys(browserStats)
				.map((k) => k)
				.filter((k) => browserStats[k] > 0)
		),
		device_distribution: deviceStats,
		browser_distribution: browserStats,
		session_data: {
			total_sessions: sessionStarts.length,
			completed_sessions: completedSessions.length,
			session_summaries_count: sessionSummaries.length,
			unique_session_ids: sessionStarts.map(s => s.session_id).filter(Boolean)
		}
	};
}

function getMostFrequent(arr) {
	if (!arr.length) return null;
	const frequency = {};
	arr.forEach((item) => {
		frequency[item] = (frequency[item] || 0) + 1;
	});
	return Object.keys(frequency).reduce((a, b) => (frequency[a] > frequency[b] ? a : b));
}

app.get("/profile", authenticateToken, async (request, response) => {
	try {
		console.log("Fetching profile for user:", request.user.userId);
		
		const events = await eventsCollection.find({ user_id: new ObjectId(request.user.userId) }).toArray();
		const allSessionEvents = await sessionsCollection.find({ user_id: new ObjectId(request.user.userId) }).toArray();
		
		console.log("Found events:", events.length);
		console.log("Found session events:", allSessionEvents.length);
		console.log("Session event types:", allSessionEvents.map(s => s.type));
		
		const features = buildFeatures(events, allSessionEvents);
		
		console.log("Generated features:", JSON.stringify(features, null, 2));

		const systemPrompt = "You are a classifier. Respond with ONLY valid JSON. No explanations, no markdown, no prose.";
		const groups = ["Cautious", "Balanced", "Opportunistic", "Impulsive", "Exploratory"];
		const userPrompt = `
Classify the user into one of ${JSON.stringify(groups)} using ONLY these FEATURES.
If uncertain, choose "Balanced".

RESPONSE FORMAT (exact JSON):
{"profile_type": "string from groups", "confidence": number between 0-1, "signals": ["string", "string"]}

FEATURES:
${JSON.stringify(features)}

EXAMPLE RESPONSE:
{"profile_type": "Balanced", "confidence": 0.7, "signals": ["moderate activity", "balanced behavior"]}

Now output the classification:`.trim();

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
			console.log("Ollama response:", data.response);

			let profile;
			try {
				profile = JSON.parse(data.response);
			} catch (parseError) {
				console.log("Direct parse failed, attempting to extract JSON:", parseError);
				const jsonMatch = data.response.match(/\{[^}]*\}/);
				if (jsonMatch) {
					try {
						profile = JSON.parse(jsonMatch[0]);
					} catch (extractError) {
						console.log("JSON extraction failed:", extractError);
						profile = {
							profile_type: "Balanced",
							confidence: 0.5,
							signals: ["fallback parse"],
						};
					}
				} else {
					console.log("No JSON found in response");
					profile = {
						profile_type: "Balanced",
						confidence: 0.5,
						signals: ["fallback parse"],
					};
				}
			}

			// Save profile to database
			try {
				await usersCollection.updateOne(
					{ _id: new ObjectId(request.user.userId) },
					{
						$set: {
							profile: profile,
							profile_updated_at: new Date(),
						},
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

let lastPrice = 100;
let priceHistory = [];

function generateInitialPrices() {
	const initialPrice = 100;
	lastPrice = initialPrice;
	priceHistory = [
		{
			price: initialPrice,
			timestamp: new Date(Date.now() - 19 * 30000).toISOString(),
		},
	];

	for (let i = 1; i < 20; i++) {
		const maxChangePercent = 0.05;
		const change = (Math.random() - 0.5) * 2 * maxChangePercent;
		const newPrice = lastPrice * (1 + change);
		lastPrice = Number(newPrice.toFixed(2));

		priceHistory.push({
			price: lastPrice,
			timestamp: new Date(Date.now() - (19 - i) * 30000).toISOString(),
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
		timestamp: new Date().toISOString(),
	};

	priceHistory.push(newPricePoint);
	if (priceHistory.length > 50) {
		priceHistory = priceHistory.slice(-50);
	}

	return lastPrice;
}

app.delete("/reset", authenticateToken, async (request, response) => {
	try {
		await eventsCollection.deleteMany({ user_id: new ObjectId(request.user.userId) });
		await sessionsCollection.deleteMany({ user_id: new ObjectId(request.user.userId) });
		response.status(200).json({ message: "Your data cleared successfully." });
	} catch (error) {
		console.error("Failed to clear user data:", error);
		response.status(500).json({ error: "Failed to clear data" });
	}
});

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