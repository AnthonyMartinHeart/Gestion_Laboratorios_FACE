// src/main/sessionStore.js
const { app } = require("electron");
const fs = require("fs");
const path = require("path");

const SFILE = path.join(app.getPath("userData"), "session.json");

function readSession() {
  try {
    const raw = fs.readFileSync(SFILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeSession(payload) {
  try {
    fs.writeFileSync(SFILE, JSON.stringify(payload, null, 2));
    return true;
  } catch {
    return false;
  }
}

function clearSession() {
  try {
    if (fs.existsSync(SFILE)) fs.unlinkSync(SFILE);
    return true;
  } catch {
    return false;
  }
}

module.exports = { readSession, writeSession, clearSession, SFILE };
