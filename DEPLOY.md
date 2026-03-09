# 🚀 ThumbCheck — Deploy Guide
## Everything you need to go live and start charging

---

## What's already built for you
- ✅ The full AI thumbnail analyser tool
- ✅ Landing page
- ✅ Free tier (3 analyses) + upgrade wall
- ✅ Stripe payment integration
- ✅ Webhook to activate Pro on payment
- ✅ User auth (email + password)
- ✅ All API routes

---

## Your 3 tasks (takes ~45 minutes total)

### TASK 1 — Get your API keys (15 min)

**Anthropic (the AI)**
1. Go to https://console.anthropic.com
2. Click API Keys → Create Key
3. Copy it — you'll need it in Task 3

**Stripe (payments)**
1. Go to https://stripe.com → create account
2. Dashboard → Developers → API Keys
3. Copy your **Secret key** (sk_live_...) and **Publishable key** (pk_live_...)
4. Go to Products → Create Product
   - Name: "ThumbCheck Pro"
   - Price: $9.00 / month / recurring
5. Click the price → copy the **Price ID** (price_xxx...)
6. Go to Developers → Webhooks → Add endpoint
   - URL: `https://YOUR-DOMAIN.vercel.app/api/stripe/webhook`
   - Events to listen: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`
7. Copy the **Webhook signing secret** (whsec_...)

---

### TASK 2 — Deploy to Vercel (10 min)

1. Go to https://vercel.com → sign up with GitHub
2. Push this project to a GitHub repo:
   ```
   git init
   git add .
   git commit -m "initial"
   gh repo create thumbcheck --public
   git push -u origin main
   ```
3. In Vercel: New Project → Import your GitHub repo
4. Click Deploy (it'll fail — that's fine, we need to add env vars next)

---

### TASK 3 — Add environment variables (10 min)

In Vercel → Your Project → Settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | Your Anthropic key |
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Your Stripe webhook secret |
| `STRIPE_PRO_PRICE_ID` | Your Stripe price ID |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` and paste result |
| `NEXTAUTH_URL` | Your Vercel URL (e.g. https://thumbcheck.vercel.app) |
| `NEXT_PUBLIC_APP_URL` | Same as above |
| `FREE_ANALYSES_LIMIT` | `3` |

Then: Vercel → Deployments → Redeploy

---

### TASK 4 — Buy a domain (5 min, optional but recommended)

1. Go to https://namecheap.com or https://porkbun.com
2. Search for `thumbcheck.io` or `thumbscore.ai` or similar (~$12-15/yr)
3. In Vercel → Your Project → Settings → Domains → Add domain
4. Follow their DNS instructions (takes ~10 min to propagate)

---

## You're live. Now get users.

### Week 1 — Free traffic (do all of these)
- [ ] Post in r/NewTubers: *"I built a free AI thumbnail grader — roast it"*
- [ ] Post in r/youtubers with a before/after screenshot
- [ ] Find 3 Facebook groups for YouTube creators, post there
- [ ] DM 20 YouTubers with 5k-50k subs: *"Hey, built a free tool that grades thumbnails — want a free analysis of your latest video?"*
- [ ] Post a 60-second demo on TikTok/Reels showing the tool in action

### Week 2+ — Keep the flywheel going
- [ ] Reply to every comment/DM personally (builds trust fast)
- [ ] Ask your first 5 users for feedback — what would make them pay $9/mo?
- [ ] Create a Twitter/X account posting thumbnail tips, linking to your tool

---

## Revenue milestones

| MRR | What it means | How to get there |
|-----|---------------|-----------------|
| $90 | 10 paying users | Reddit + direct DMs |
| $450 | 50 paying users | Word of mouth kicks in |
| $900 | 100 paying users | Start paid TikTok ads |
| $4,500 | 500 paying users | Hire someone to do Reddit/socials |

---

## Questions?
Once deployed, the next things to build are:
1. A/B thumbnail comparison (compare 2 thumbnails head to head)
2. Title analyser (same model, different prompt)
3. Bulk analysis for big channels ($29/mo tier)
