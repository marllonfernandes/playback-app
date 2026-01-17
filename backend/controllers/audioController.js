const {
  downloadAudio,
  separateAudio,
  changePitch,
} = require("../utils/audioProcessor");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

exports.processTrack = async (req, res) => {
  try {
    const io = req.app.get("socketio");
    const { options } = req.body; // New field for options
    let filePath;
    let id;
    let title = "Unknown Title";
    let thumbnail = null;

    if (req.file) {
      filePath = req.file.path;
      id = path.basename(filePath, path.extname(filePath)); // Use unique suffix as ID
      title = req.file.originalname;
      console.log(`Processing uploaded file: ${filePath}`);
    } else if (req.body.url) {
      const { url } = req.body;
      id = uuidv4();
      console.log(`Processing ${id} - Download...`);
      // We will process download synchronously for now as it's usually fast enough to start job
      // Or strictly we should async this too. Let's async everything.
      // We need to return an ID to the user to listen to.

      // Return immediately
      res.json({ status: "processing", id });

      // Start async process
      (async () => {
        try {
          io.emit("progress", { id, status: "Downloading...", percent: 10 });
          const dlResult = await downloadAudio(url, id);
          filePath = dlResult.path;
          title = dlResult.title || title;
          thumbnail = dlResult.thumbnail;

          processSeparation(filePath, id, title, options, io, thumbnail);
        } catch (e) {
          if (e.message === "Process cancelled") {
            console.log(`Job ${id} cancelled successfully.`);
            // Optional: emit 'cancelled' event if frontend needs it, but it already knows.
            // io.emit("cancelled", { id });
          } else {
            console.error(e);
            io.emit("error", { id, error: e.message });
          }
        }
      })();
      return;
    } else {
      return res.status(400).json({ error: "No file or URL provided" });
    }

    // If file was uploaded, we already have filePath.
    // Return immediately telling user job started
    res.json({ status: "processing", id });

    // Async separation
    processSeparation(filePath, id, title, options, io, thumbnail);
  } catch (error) {
    console.error("Error initiating track:", error);
    if (!res.headersSent) res.status(500).json({ error: error.message });
  }
};

async function processSeparation(
  filePath,
  id,
  title,
  options,
  io,
  thumbnailPath
) {
  try {
    io.emit("progress", { id, status: "Separating stems...", percent: 30 });
    console.log(`Processing ${id} - Separation with options: ${options}`);

    const result = await separateAudio(
      filePath,
      id,
      options || "-n htdemucs_6s"
    );

    const trackName = path.basename(
      result.original,
      path.extname(result.original)
    );
    const model = result.model;

    // Verify files exist or list them if dynamic?
    // simple map for now

    // Save metadata
    let savedThumbnail = null;
    try {
      const metadataPath = path.join(
        path.resolve(__dirname, "../../downloads/separated"),
        model,
        trackName,
        "metadata.json"
      );
      const metadataDir = path.dirname(metadataPath);

      if (fs.existsSync(metadataDir)) {
        // Only copy thumbnail and save metadata if the output directory actually exists (meaning separation succeeded)
        if (thumbnailPath && fs.existsSync(thumbnailPath)) {
          const targetThumbPath = path.join(metadataDir, "thumbnail.jpg");
          try {
            fs.copyFileSync(thumbnailPath, targetThumbPath);
            savedThumbnail = `/downloads/separated/${model}/${trackName}/thumbnail.jpg`;
          } catch (copyErr) {
            console.error("Failed to copy thumbnail:", copyErr);
          }
        }

        fs.writeFileSync(
          metadataPath,
          JSON.stringify(
            { title, thumbnail: savedThumbnail, date: new Date() },
            null,
            2
          )
        );
      } else {
        console.warn(`Separation output directory not found: ${metadataDir}`);
      }
    } catch (e) {
      console.error("Error saving metadata:", e);
    }

    const stems = {
      vocals: `/downloads/separated/${model}/${trackName}/vocals.mp3`,
      drums: `/downloads/separated/${model}/${trackName}/drums.mp3`,
      bass: `/downloads/separated/${model}/${trackName}/bass.mp3`,
      other: `/downloads/separated/${model}/${trackName}/other.mp3`,
      piano: `/downloads/separated/${model}/${trackName}/piano.mp3`,
      guitar: `/downloads/separated/${model}/${trackName}/guitar.mp3`,
    };

    const response = {
      id: trackName,
      title,
      thumbnail: savedThumbnail, // Send the new location
      stems,
    };

    io.emit("complete", response);
  } catch (error) {
    if (error.message === "Process cancelled") {
      console.log(`Separation job ${id} cancelled successfully.`);
    } else {
      console.error("Error in async process:", error);
      io.emit("error", { id, error: error.message });
    }
  }
}

exports.changePitch = async (req, res) => {
  // ... pitch logic
  try {
    const { filePath, semitones } = req.body;
    if (!filePath || semitones === undefined)
      return res.status(400).json({ error: "Missing parameters" });

    console.log(`Pitch shift: ${semitones} semitones for ${filePath}`);

    // Strip query parameters (e.g. ?t=...)
    const cleanPath = filePath.split("?")[0].replace(/^\/downloads/, "");
    const absPath = path.join(
      path.resolve(__dirname, "../../downloads"),
      cleanPath
    );

    const newPath = await changePitch(absPath, parseInt(semitones));

    const relativePath = path.relative(
      path.resolve(__dirname, "../../downloads"),
      newPath
    );
    res.json({ url: `/downloads/${relativePath}` });
  } catch (error) {
    console.error("Error changing pitch:", error);
    res.status(500).json({ error: error.message });
  }
};

const fs = require("fs");

exports.getTracks = async (req, res) => {
  try {
    const separatedDir = path.join(
      path.resolve(__dirname, "../../downloads"),
      "separated"
    );

    if (!fs.existsSync(separatedDir)) {
      return res.json([]);
    }

    const models = fs.readdirSync(separatedDir).filter((file) => {
      return fs.statSync(path.join(separatedDir, file)).isDirectory();
    });

    let tracks = [];

    models.forEach((model) => {
      const modelDir = path.join(separatedDir, model);
      const subfolders = fs
        .readdirSync(modelDir)
        .filter((file) => fs.statSync(path.join(modelDir, file)).isDirectory());

      subfolders.forEach((trackName) => {
        let displayTitle = trackName;
        const metadataPath = path.join(modelDir, trackName, "metadata.json");

        if (fs.existsSync(metadataPath)) {
          try {
            const meta = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
            if (meta.title) displayTitle = meta.title;
            var displayThumbnail = meta.thumbnail || null; // use var to be accessible outside block (or let/const if careful)
          } catch (e) {
            console.error("Error reading metadata for", trackName);
          }
        } else {
          var displayThumbnail = null;
        }

        tracks.push({
          id: trackName, // Using folder name as ID
          title: displayTitle,
          thumbnail: displayThumbnail,
          model: model,
          stems: {
            vocals: `/downloads/separated/${encodeURIComponent(
              model
            )}/${encodeURIComponent(trackName)}/vocals.mp3`,
            drums: `/downloads/separated/${encodeURIComponent(
              model
            )}/${encodeURIComponent(trackName)}/drums.mp3`,
            bass: `/downloads/separated/${encodeURIComponent(
              model
            )}/${encodeURIComponent(trackName)}/bass.mp3`,
            other: `/downloads/separated/${encodeURIComponent(
              model
            )}/${encodeURIComponent(trackName)}/other.mp3`,
            piano: `/downloads/separated/${encodeURIComponent(
              model
            )}/${encodeURIComponent(trackName)}/piano.mp3`,
            guitar: `/downloads/separated/${encodeURIComponent(
              model
            )}/${encodeURIComponent(trackName)}/guitar.mp3`,
          },
        });
      });
    });

    res.json(tracks);
  } catch (error) {
    console.error("Error listing tracks:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTrack = async (req, res) => {
  try {
    const { id, model } = req.params;
    if (!id || !model)
      return res.status(400).json({ error: "Missing id or model" });

    const trackDir = path.join(
      path.resolve(__dirname, "../../downloads/separated"),
      model,
      id
    );

    if (fs.existsSync(trackDir)) {
      console.log(`Deleting track directory: ${trackDir}`);
      fs.rmSync(trackDir, { recursive: true, force: true });

      // Cleanup: Try to delete the original downloaded file too if it exists
      const downloadsDir = path.resolve(__dirname, "../../downloads");
      const files = fs.readdirSync(downloadsDir);
      const originalFile = files.find((f) => f.startsWith(id + "."));
      if (originalFile) {
        fs.unlinkSync(path.join(downloadsDir, originalFile));
        console.log(`Deleted original file: ${originalFile}`);
      }
    } else {
      return res.status(404).json({ error: "Track not found" });
    }

    res.json({ success: true });
  } catch (e) {
    console.error("Error deleting track:", e);
    res.status(500).json({ error: e.message });
  }
};
const jobManager = require("../utils/jobManager");

exports.cancelJob = (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing ID" });

  const cancelled = jobManager.cancel(id);
  if (cancelled) {
    console.log(`Job ${id} cancelled by user`);
    res.json({ success: true, message: "Job cancelled" });
  } else {
    res.status(404).json({ error: "Job not found or already completed" });
  }
};
