const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "releases.json");

app.use(express.json());
app.use("/storage", express.static(path.join(__dirname, "storage")));
app.use(express.static(path.join(__dirname, "public")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "audio") {
      cb(null, path.join(__dirname, "storage", "audio"));
      return;
    }
    cb(null, path.join(__dirname, "storage", "artwork"));
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const upload = multer({ storage });

function readReleases() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    return [];
  }
}

function writeReleases(releases) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(releases, null, 2));
}

app.get("/api/releases", (req, res) => {
  res.json(readReleases());
});

app.post(
  "/api/releases",
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "artwork", maxCount: 1 },
  ]),
  (req, res) => {
    const { title, artist, description, platforms, releaseDate } = req.body;

    if (!title || !artist || !req.files?.audio?.[0]) {
      res.status(400).json({
        error: "title, artist, and an audio file are required",
      });
      return;
    }

    const selectedPlatforms = (platforms || "")
      .split(",")
      .map((platform) => platform.trim())
      .filter(Boolean);

    const releases = readReleases();
    const release = {
      id: uuidv4(),
      title,
      artist,
      description: description || "",
      releaseDate: releaseDate || null,
      platforms: selectedPlatforms,
      manualUploadStatus: Object.fromEntries(
        selectedPlatforms.map((platform) => [platform, "pending"]),
      ),
      files: {
        audio: {
          originalName: req.files.audio[0].originalname,
          storagePath: `/storage/audio/${req.files.audio[0].filename}`,
          size: req.files.audio[0].size,
        },
        artwork: req.files?.artwork?.[0]
          ? {
              originalName: req.files.artwork[0].originalname,
              storagePath: `/storage/artwork/${req.files.artwork[0].filename}`,
              size: req.files.artwork[0].size,
            }
          : null,
      },
      createdAt: new Date().toISOString(),
    };

    releases.unshift(release);
    writeReleases(releases);

    res.status(201).json(release);
  },
);

app.patch("/api/releases/:id/platform-status", (req, res) => {
  const { id } = req.params;
  const { platform, status } = req.body;
  const allowedStatuses = ["pending", "uploaded", "failed"];

  if (!platform || !allowedStatuses.includes(status)) {
    res.status(400).json({ error: "platform and valid status are required" });
    return;
  }

  const releases = readReleases();
  const release = releases.find((item) => item.id === id);

  if (!release) {
    res.status(404).json({ error: "release not found" });
    return;
  }

  release.manualUploadStatus[platform] = status;
  writeReleases(releases);

  res.json(release);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Music distribution service is running on http://localhost:${PORT}`);
});
