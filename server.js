import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("🚀 PulseGurgaon is LIVE!");
});

// Sample news route
app.get("/news", (req, res) => {
  res.json([
    {
      title: "AI is changing the world",
      summary: ["AI growing fast", "Used everywhere", "Future impact huge"],
      content: "This is a sample article. Your AI system will replace this."
    }
  ]);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});