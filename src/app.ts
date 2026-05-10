import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import corsOptions from "./config/corsOptions";

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(helmet());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.status(200).send("AIByte Website API!");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/api", (req, res) => {
  res.status(200).json({message: "AIByte Website API is working!"});
});

// app.use("/api/v1", userRoutes);

app.use((req, res) => {
  res.status(404).json({message: "Route not found!"});
});

export default app;
