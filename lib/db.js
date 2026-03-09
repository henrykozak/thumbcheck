// lib/db.js
// Lightweight JSON-file store for MVP. Replace with Supabase or PlanetScale when you scale.
// Usage: npm install lowdb@3

import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";

const FILE = path.join(process.cwd(), "data", "db.json");
const DEFAULT = { users: [], usage: {} };

let db;

async function getDb() {
  if (!db) {
    const adapter = new JSONFile(FILE);
    db = new Low(adapter, DEFAULT);
    await db.read();
    db.data ||= DEFAULT;
  }
  return db;
}

// ── Usage tracking (for free tier) ──────────────────────────────────────────

export async function getUserUsage(userId) {
  const db = await getDb();
  return db.data.usage[userId] || 0;
}

export async function incrementUsage(userId) {
  const db = await getDb();
  db.data.usage[userId] = (db.data.usage[userId] || 0) + 1;
  await db.write();
}

// ── Pro status ───────────────────────────────────────────────────────────────

export async function isProUser(userId) {
  const db = await getDb();
  const user = db.data.users.find(u => u.id === userId);
  return user?.isPro === true;
}

export async function setUserPro(userId, subscriptionId) {
  const db = await getDb();
  const idx = db.data.users.findIndex(u => u.id === userId);
  if (idx >= 0) {
    db.data.users[idx].isPro = true;
    db.data.users[idx].subscriptionId = subscriptionId;
  } else {
    db.data.users.push({ id: userId, isPro: true, subscriptionId });
  }
  await db.write();
}

export async function removeUserPro(subscriptionId) {
  const db = await getDb();
  const idx = db.data.users.findIndex(u => u.subscriptionId === subscriptionId);
  if (idx >= 0) {
    db.data.users[idx].isPro = false;
    db.data.users[idx].subscriptionId = null;
    await db.write();
  }
}

export async function createUser(email, hashedPassword) {
  const db = await getDb();
  const id = `user_${Date.now()}`;
  db.data.users.push({ id, email, password: hashedPassword, isPro: false });
  await db.write();
  return { id, email };
}

export async function findUserByEmail(email) {
  const db = await getDb();
  return db.data.users.find(u => u.email === email) || null;
}
