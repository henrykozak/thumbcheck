// pages/api/stripe/webhook.js
// Listens for Stripe events to activate/deactivate Pro

import Stripe from "stripe";
import { buffer } from "micro";
import { setUserPro, removeUserPro } from "../../../lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: { bodyParser: false }, // Required for webhook signature verification
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    // ── Payment successful → activate Pro ──────────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId || session.client_reference_id;
      if (userId) {
        await setUserPro(userId, session.subscription);
        console.log(`Pro activated for user ${userId}`);
      }
      break;
    }

    // ── Subscription renewed ───────────────────────────────────────────
    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      if (invoice.subscription) {
        const sub = await stripe.subscriptions.retrieve(invoice.subscription);
        const userId = sub.metadata?.userId;
        if (userId) await setUserPro(userId, invoice.subscription);
      }
      break;
    }

    // ── Subscription cancelled / payment failed → remove Pro ──────────
    case "customer.subscription.deleted":
    case "invoice.payment_failed": {
      const obj = event.data.object;
      const subId = obj.subscription || obj.id;
      if (subId) {
        await removeUserPro(subId);
        console.log(`Pro removed for subscription ${subId}`);
      }
      break;
    }
  }

  res.status(200).json({ received: true });
}
