# Portfolio chatbot backend

This is a tiny Cloudflare Worker that sits between your portfolio site and Claude. It exists for one reason: your Anthropic API key must never live in the browser, because anything in the frontend code is public. The Worker keeps the key server side and just relays messages.

## What you need

- A free Cloudflare account (workers.cloudflare.com)
- An Anthropic API key from console.anthropic.com

## Deploy in 5 steps (no coding, no build tools)

1. Sign in to Cloudflare, then go to **Workers & Pages** and click **Create** then **Create Worker**.
2. Give it a name (for example `portfolio-chatbot`) and click **Deploy** to create a starter worker.
3. Click **Edit code**, delete everything in the editor, and paste in the full contents of `worker.js`. Click **Deploy**.
4. Go to the worker's **Settings** then **Variables and Secrets**. Add a new **Secret**:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your Anthropic API key
   - Save and deploy.
5. Copy your Worker URL. It looks like `https://portfolio-chatbot.YOUR-NAME.workers.dev`.

Then open `chatbot.js` in the portfolio folder and paste that URL into the `CHATBOT_API_URL` line near the top.

## Testing it

Once the URL is set, open the site and click the chat button in the bottom right. Ask something like "What kind of projects does Zohaib do?"

## Cost

Each message is one Claude API call. The default model is `claude-opus-4-8` (highest quality). If the bot gets a lot of traffic and you want to lower the cost, open `worker.js` and change the `MODEL` line to `claude-haiku-4-5`, which is much cheaper and still great for answering questions about you. Redeploy after changing it.

## Locking it down (optional)

By default any website can call the Worker. To restrict it to only your portfolio, open `worker.js` and change `ALLOWED_ORIGINS` from `["*"]` to your real site, for example:

```js
const ALLOWED_ORIGINS = ["https://zohaib-commits.github.io", "http://localhost:8137"];
```

The Worker also caps message length and conversation size so nobody can run up a large bill.
