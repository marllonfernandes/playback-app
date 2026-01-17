const express = require("express");
const cors = require("cors");
const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Directories
const DOWNLOADS_DIR = path.join(__dirname, "../downloads");

if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR);
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", demucs: "ready" });
});

app.use("/downloads", express.static(DOWNLOADS_DIR));
app.use(express.static(path.join(__dirname, "public")));

const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DOWNLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

const audioController = require("./controllers/audioController");

app.post("/api/process", upload.single("file"), audioController.processTrack);
app.get("/api/tracks", audioController.getTracks);
app.delete("/api/tracks/:model/:id", audioController.deleteTrack);
app.post("/api/pitch", audioController.changePitch);
app.post("/api/cancel", audioController.cancelJob);

// Handle SPA
app.get(/.*/, (req, res) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/downloads")) {
    return res.status(404).json({ error: "Not found" });
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all for now
    methods: ["GET", "POST"],
  },
});

// Make io available in routes
app.set("socketio", io);

io.on("connection", (socket) => {
  console.log("User connected", socket.id);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
