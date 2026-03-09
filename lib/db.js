// lib/db.js
// Simple in-memory + JSON file store for MVP

import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "db.json");

function readDb() {
  try {
    if (!fs.existsSync(FILE)) {
      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      fs.writeFileSync(FILE, JSON.stringify({ users: [], usage: {} }));
    }
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return { users: [], usage: {} };
  }
}

function writeDb(data) {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("DB write error:", e);
  }
}

export async function getUserUsage(userId) {
  return readDb().usage[userId] || 0;
}

export async function incrementUsage(userId) {
  const db = readDb();
  db.usage[userId] = (db.usage[userId] || 0) + 1;
  writeDb(db);
}

export async function isProUser(userId) {
  const db = readDb();
  const user = db.users.find(u => u.id === userId);
  return user?.isPro === true;
}

export async function setUserPro(userId, subscriptionId) {
  const db = readDb();
  const idx = db.users.findIndex(u => u.id === userId);
  if (idx >= 0) {
    db.users[idx].isPro = true;
    db.users[idx].subscriptionId = subscriptionId;
  } else {
    db.users.push({ id: userId, isPro: true, subscriptionId });
  }
  writeDb(db);
}

export async function removeUserPro(subscriptionId) {
  const db = readDb();
  const idx = db.users.findIndex(u => u.subscriptionId === subscriptionId);
  if (idx >= 0) {
    db.users[idx].isPro = false;
    db.users[idx].subscriptionId = null;
    writeDb(db);
  }
}

export async function createUser(email, hashedPassword) {
  const db = readDb();
  const id = `user_${Date.now()}`;
  db.users.push({ id, email, password: hashedPassword, isPro: false });
  writeDb(db);
  return { id, email };
}

export async function findUserByEmail(email) {
  return readDb().users.find(u => u.email === email) || null;
}
