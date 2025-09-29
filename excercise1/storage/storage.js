import express from "express";
import fs from "fs";

const app = express();

const PORT = process.env.STORAGE_PORT || 8197;
const STORAGE_DATA_FILE = process.env.STORAGE_DATA_FILE || "/data/log.txt";

app.use(express.text());

app.post("/log", (req, res) => {
  const record = req.body;
  // Write to storage file
  try {
    fs.appendFileSync(STORAGE_DATA_FILE, record + "\n");
    res.send("OK\n");
  } catch (error) {
    console.error("Failed to write to storage file:", error.message);
    res.status(500).send("Failed to write log\n");
  }
});

app.get("/log", (req, res) => {
  let content = "";
  try {
    content = fs.readFileSync(STORAGE_DATA_FILE, "utf-8");
  } catch (error) {
    if (error.code === "ENOENT") {
      console.warn("Log file does not exist yet.");
      content = "";
    } else {
      console.error("Failed to read storage file:", error.message);
      return res.status(500).send("Error reading log\n");
    }
  }
  res.type("text/plain").send(content);
});

app.get("/clear", (req, res) => {
  fs.writeFileSync(STORAGE_DATA_FILE, "");
  res.type("text/plain").send("Cleared storage log\n");
});


app.listen(PORT, () => {
  console.log(`Storage service running at http://localhost:${PORT}`);
});