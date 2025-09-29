import express from "express";
import checkDiskSpace from "check-disk-space";
import fs from "fs";
import fetch from "node-fetch";

const app = express();

const PORT = 8199;
const VSTORAGE = process.env.VSTORAGE_PATH || "/vstorage";
const STORAGE_URL = process.env.STORAGE_URL || "http://storage:8197";
const SERVICE2_URL = process.env.SERVICE2_URL || "http://service2:8198/status";

app.get("/status", async (req, res) => {
  const uptime = process.uptime() / 3600;
  const disk = await checkDiskSpace("/");
  const freeDisk = (disk.free / (1024 * 1024)).toFixed(0);

  const record = `Timestamp1: ${new Date().toISOString().replace(/\.\d{3}Z$/, "Z")}, uptime ${uptime.toFixed(
    2
  )} hours, free disk in root: ${freeDisk} MBytes`;

  // Write status to vStorage
  try {
  fs.appendFileSync(VSTORAGE, record + "\n");
  } catch (error) {
    console.error("Failed to write status to vStorage:", error.message);
  }

  // Send status to Storage
  try {
    await fetch(`${STORAGE_URL}/log`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: record,
    });
  } catch (error) {
    console.error("Failed to send status to Storage:", error.message);
  }

  let record2 = "Status from service2 not available";
  try {
    const response2 = await fetch(SERVICE2_URL);
    record2 = await response2.text();
  } catch (error) {
    console.error("Failed to get status from Service2:", error.message);
  }

  res.type("text/plain").send(record + "\n" + record2);
});

//Clear both vStorage and Storage logs
app.get("/clear", async (req, res) => {
  try {
    fs.writeFileSync(VSTORAGE, "");
    await fetch(`${STORAGE_URL}/clear`).catch(() => null);
    res.type("text/plain").send("Cleared vStorage and Storage logs\n");
  } catch (error) {
    res.status(500).send(`Error clearing logs: ${error.message}\n`);
  }
});

app.get("/log", async (req, res) => {
  try {
    const response = await fetch(`${STORAGE_URL}/log`);
    const logs = await response.text();
    res.type("text/plain").send(logs);
  } catch (error) {
    console.error("Failed to fetch logs from Storage:", error.message);
    res.status(500).send("Error retrieving logs");
  }
});

app.listen(PORT, () => {
  console.log(`Service1 running at http://localhost:${PORT}`);
});
