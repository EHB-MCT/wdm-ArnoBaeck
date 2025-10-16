import express from "express";

const app = express();
const port = 3000;
app.use(express.json());

app.get('/', (request, response) => {
  response.status(200).send('Hello world');
});

app.get("/api/chat", async (request, response) => {
  try {
    const prompt = request.body.prompt;
    console.log("Prompt received:", prompt);
    const res = await fetch("http://ollama:11434/api/generate", { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: prompt,
        stream: false
      }),
    });

    const data = await res.json();
    const output = data.response || "No response generated";

    response.send(output);

  } catch (err) {
    console.error("Ollama error:", err);
    response.status(500).json({ error: "Failed to connect to Ollama" });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));