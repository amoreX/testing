import express from "express";
import cors from "cors";
import "dotenv";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "./supabase-client.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.get("/users", async (req: Request, res: Response):Promise<any> => {
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

app.post("/user", async (req: Request, res: Response) :Promise<any> => {
  const { email, password, name } = req.body;
  // console.log(email, password, name);
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { error: insertError } = await supabase.from("users").insert([
      {
        email: email,
        name: name,
        password: hashedPassword,
        current_mental_state: "",
        recommendations: [],
      },
    ]);
    // console.log(insertError);
    if (insertError) {
      return res.status(500).json({
        error: `Internal server error : ${insertError.message}`,
      });
    }
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ error: `Internal server error : ${err}` });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
