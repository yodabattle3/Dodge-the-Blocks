const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load OR create keys file
const KEYS_FILE = "./keys.json";
if (!fs.existsSync(KEYS_FILE)) fs.writeFileSync(KEYS_FILE, "[]");

// Serve admin HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// Return keys JSON for Roblox
app.get("/keys", (req, res) => {
  const data = fs.readFileSync(KEYS_FILE, "utf8"); // FIXED HERE
  res.json(JSON.parse(data));
});

// Admin API to add keys
app.post("/addKey", (req, res) => {
  const { adminPW, hours } = req.body;

  if (adminPW !== process.env.ADMIN_PASSWORD)
    return res.status(403).send("Wrong password");

  let keys = JSON.parse(fs.readFileSync(KEYS_FILE, "utf8"));

  const newKey = {
    key: "KEY-" + Math.random().toString(36).substring(2, 12).toUpperCase(),
    expiresAt: Date.now() + hours * 3600000
  };

  keys.push(newKey);
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));

  res.send(newKey);
});

app.listen(3000, () => console.log("Server online"));
