import express from "express";
import cors from "cors";
import "dotenv/config";
import "./config/db.js";

import authRoutes    from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import adminRoutes   from "./routes/adminRoutes.js";
import intakeRoutes  from "./routes/intakeRoutes.js";
import courseRoutes  from "./routes/courseRoutes.js";
import logRoutes     from "./routes/logRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth",     authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/admins",   adminRoutes);
app.use("/api/intakes",  intakeRoutes);
app.use("/api/courses",  courseRoutes);
app.use("/api/logs",     logRoutes);

app.get("/", (req, res) => res.send("SMS Backend Running 🚀"));

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

export default app;