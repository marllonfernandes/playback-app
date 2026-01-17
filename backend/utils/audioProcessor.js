const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const jobManager = require("./jobManager");

const DOWNLOADS_DIR = path.resolve(__dirname, "../../downloads");
const OUTPUT_DIR = path.join(DOWNLOADS_DIR, "separated");

// Ensure directories exist
if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR);

function runCommand(cmd, id) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${cmd}`);

    // Use spawn with shell: true to support command strings with arguments/pipes
    const child = spawn(cmd, { shell: true });

    let stdoutData = "";
    let stderrData = "";

    if (child.stdout) {
      child.stdout.on("data", (data) => {
        stdoutData += data;
        // Optional: stream output to console if needed for debugging
        // process.stdout.write(data);
      });
    }

    if (child.stderr) {
      child.stderr.on("data", (data) => {
        stderrData += data;
        // process.stderr.write(data);
      });
    }

    child.on("error", (error) => {
      console.error(`Error spawning command: ${cmd}`, error);
      // Clean up is handled by register usually, but if spawn fails immediately:
      if (id) jobManager.unregister(id);
      reject(error);
    });

    child.on("close", (code, signal) => {
      if (id) jobManager.unregister(id);

      if (code !== 0) {
        // If killed by signal (like SIGTERM from cancel)
        if (signal === "SIGTERM") {
          return reject(new Error("Process cancelled"));
        }

        console.error(`Command failed with code ${code}: ${cmd}`);
        console.error("Stderr:", stderrData);
        return reject(new Error(`Command failed: ${cmd}\n${stderrData}`));
      }

      resolve({ stdout: stdoutData, stderr: stderrData });
    });

    // Register for cancellation
    if (id) {
      jobManager.register(id, child);
    }
  });
}

async function downloadAudio(url, id) {
  // First, get the title
  const titleCmd = `yt-dlp --print title "${url}"`;
  let title = "Unknown Title";
  try {
    // We don't track the title command as it's quick, but we could
    const { stdout } = await runCommand(titleCmd, id);
    title = stdout.trim().replace(/[^\w\s\.-]/g, ""); // Sanitize
  } catch (e) {
    if (e.message === "Process cancelled") throw e;
    console.error("Failed to get title, using ID", e);
    title = id;
  }

  const outputPath = path.join(DOWNLOADS_DIR, `${id}.%(ext)s`);
  const cmd = `yt-dlp -x --audio-format wav --write-thumbnail --convert-thumbnails jpg -o "${outputPath}" ${url}`;

  console.log("Starting download:", cmd);
  await runCommand(cmd, id);

  const wavPath = path.join(DOWNLOADS_DIR, `${id}.wav`);
  const thumbPath = path.join(DOWNLOADS_DIR, `${id}.jpg`);
  const thumbnail = fs.existsSync(thumbPath) ? thumbPath : null;

  if (fs.existsSync(wavPath)) return { path: wavPath, title, thumbnail };
  throw new Error("Downloaded file not found");
}

async function separateAudio(filePath, id, optionsStr = "-n htdemucs_6s") {
  let cmd = `demucs ${optionsStr}`;

  if (!cmd.includes("--mp3")) {
    cmd += " --mp3-bitrate=320";
  }

  cmd += ` -o "${OUTPUT_DIR}" "${filePath}"`;

  console.log("Starting separation:", cmd);
  await runCommand(cmd, id);

  const trackName = path.basename(filePath, path.extname(filePath));

  let model = "htdemucs_6s";
  const match = optionsStr.match(/-n\s+([^\s]+)/);
  if (match) {
    model = match[1];
  }

  const ext = ".mp3";

  return {
    original: filePath,
    model: model,
    stems: {
      vocals: path.join(OUTPUT_DIR, model, trackName, `vocals${ext}`),
      drums: path.join(OUTPUT_DIR, model, trackName, `drums${ext}`),
      bass: path.join(OUTPUT_DIR, model, trackName, `bass${ext}`),
      other: path.join(OUTPUT_DIR, model, trackName, `other${ext}`),
      piano: path.join(OUTPUT_DIR, model, trackName, `piano${ext}`),
      guitar: path.join(OUTPUT_DIR, model, trackName, `guitar${ext}`),
    },
  };
}

async function changePitch(filePath, semitones) {
  // Same as before but use runCommand if we want to cancel pitch shifts too (optional)
  // For now leaving as promisify(exec) is fine, or switch to runCommand without ID if cancellation not needed here
  // But let's switch to runCommand generally to keep it consistent, passing null ID

  const ext = path.extname(filePath);
  const dir = path.dirname(filePath);
  let name = path.basename(filePath, ext);

  const pitchMatch = name.match(/^(.*)_pitch_-?\d+$/);
  let originalFilePath = filePath;

  if (pitchMatch) {
    const originalName = pitchMatch[1];
    originalFilePath = path.join(dir, `${originalName}${ext}`);
    name = originalName;
  }

  if (semitones === 0) {
    if (fs.existsSync(originalFilePath)) {
      return originalFilePath;
    } else {
      return filePath;
    }
  }

  if (!fs.existsSync(originalFilePath))
    throw new Error(`File not found: ${originalFilePath}`);

  const outputPath = path.join(dir, `${name}_pitch_${semitones}${ext}`);
  const shift = semitones * 100;
  const cmd = `sox "${originalFilePath}" "${outputPath}" pitch ${shift}`;

  console.log("Changing pitch:", cmd);
  await runCommand(cmd, null); // No ID, so not cancellable via main job ID (ok for now)

  return outputPath;
}

module.exports = { downloadAudio, separateAudio, changePitch };
