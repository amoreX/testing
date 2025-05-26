import express from "express";
import cors from "cors";
import "dotenv";
import { supabase } from "./supabase-client.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.get("/users", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("*");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
