import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5174",
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes Import and Usage
import authRoutes from "./routes/auth.route.js";

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API is running....");
});

export default app;
