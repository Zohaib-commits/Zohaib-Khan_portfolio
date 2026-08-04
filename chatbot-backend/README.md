# Portfolio chatbot backend

This is a tiny Cloudflare Worker that sits between your portfolio site and Groq (a free, fast LLM API). It exists for one reason: your API key must never live in the browser, because anything in the frontend code is public. The Worker keeps the key server side and just relays messages.

## What you need

- A free Cloudflare account (workers.cloudflare.com)
- A free Groq API key from console.groq.com

## Get your Groq API key (free, no credit card)

1. Go to console.groq.com and sign up or sign in.
2. Open **API Keys** and click **Create API Key**.
3. Copy the key. You will paste it into Cloudflare in step 4 below. Keep it private and never put it in the website code.

## Deploy in 5 steps (no coding, no build tools)

1. Sign in to Cloudflare, then go to **Workers & Pages** and click **Create** then **Create Worker**.
2. Give it a name (for example `portfolio-chatbot`) and click **Deploy** to create a starter worker.
3. Click **Edit code**, delete everything in the editor, and paste in the full contents of `worker.js`. Click **Deploy**.
4. Go to the worker's **Settings** then **Variables and Secrets**. Add a new **Secret**:
   - Name: `GROQ_API_KEY`
   - Value: your Groq API key
   - Save and deploy.
5. Copy your Worker URL. It looks like `https://portfolio-chatbot.YOUR-NAME.workers.dev`.

Then open `chatbot.js` in the portfolio folder and paste that URL into the `CHATBOT_API_URL` line near the top.

## Testing it

Once the URL is set, open the site and click the chat button in the bottom right. Ask something like "What kind of projects does Zohaib do?"

## Cost

Groq has a generous free tier that is more than enough for a portfolio chatbot, so this should cost nothing. The Worker also caps message length and conversation size so nobody can abuse it.

## Changing the model

The default model is `llama-3.3-70b-versatile` (good quality, free). If Groq retires it or you want a different one, open `worker.js`, change the `MODEL` line to any current model from console.groq.com/docs/models, and redeploy.

## Locking it down (optional)

By default any website can call the Worker. To restrict it to only your portfolio, open `worker.js` and change `ALLOWED_ORIGINS` from `["*"]` to your real site, for example:

```js
const ALLOWED_ORIGINS = ["https://zohaib-commits.github.io", "http://localhost:8137"];
```
