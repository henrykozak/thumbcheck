// pages/api/analyse.js
// Core analysis endpoint - handles free tier limits + paid tier

import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "next-auth/react";
import { getUserUsage, incrementUsage, isProUser } from "../../lib/db";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const FREE_LIMIT = parseInt(process.env.FREE_ANALYSES_LIMIT || "3");

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { imageBase64, keyword, mediaType = "image/jpeg" } = req.body;

  if (!imageBase64 || !keyword?.trim()) {
    return res.status(400).json({ error: "Image and keyword are required." });
  }

  // ── Auth & Usage check ──────────────────────────────────────────────────
  const session = await getSession({ req });
  const userId = session?.user?.id || req.headers["x-forwarded-for"] || "anon";
  const isPro = session ? await isProUser(session.user.id) : false;

  if (!isPro) {
    const usage = await getUserUsage(userId);
    if (usage >= FREE_LIMIT) {
      return res.status(402).json({
        error: "free_limit_reached",
        message: `You've used all ${FREE_LIMIT} free analyses. Upgrade to Pro for unlimited.`,
        upgradeUrl: "/pricing",
      });
    }
  }

  // ── Run analysis ────────────────────────────────────────────────────────
  const prompt = `You are an expert YouTube thumbnail analyst.

Analyse this thumbnail for the search keyword: "${keyword}"

Return ONLY valid JSON (no markdown, no backticks):
{
  "score": <1-100>,
  "verdict": "<one punchy sentence>",
  "summary": "<2-3 sentence honest assessment>",
  "metrics": {
    "clickability": <1-100>,
    "clarity": <1-100>,
    "competition": <1-100>
  },
  "issues": [
    {"severity": "high|medium|low", "text": "<specific issue>"},
    {"severity": "high|medium|low", "text": "<specific issue>"},
    {"severity": "high|medium|low", "text": "<specific issue>"}
  ],
  "tips": [
    "<specific actionable tip>",
    "<specific actionable tip>",
    "<specific actionable tip>"
  ]
}

Be brutally honest. Analyse: visual hierarchy, text legibility, emotional trigger, face/expression, colour contrast, keyword relevance.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          { type: "text", text: prompt },
        ],
      }],
    });

    const text = response.content.map(c => c.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    // Track usage for free tier
    if (!isPro) await incrementUsage(userId);

    // For free users, strip tips (keep them wanting more)
    if (!isPro) {
      result.tips = null;
      result.tier = "free";
      result.analysesRemaining = Math.max(0, FREE_LIMIT - (await getUserUsage(userId)));
    } else {
      result.tier = "pro";
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("Analysis error:", err);
    return res.status(500).json({ error: "Analysis failed. Please try again." });
  }
}
