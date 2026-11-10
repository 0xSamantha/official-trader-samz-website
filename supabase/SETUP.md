# Connect Say Hi! (separate from DBD)

Nothing here has been deployed. Use a NEW personal-site Supabase project. Do not run these steps in the DBD project. No accounts, passwords, login settings, or tables are shared.

1. In Supabase Dashboard create a new project, e.g. `samantha-personal-site`. Keep its database password private.
2. In that project's **SQL Editor**, create a query, paste all of `supabase/schema.sql`, and run it. The initial total is 0. Running the SQL again preserves the total.
3. In **Edge Functions**, create a function named `say-hi` using the editor. Replace the starter code with `supabase/functions/say-hi/index.ts`.
4. This endpoint intentionally permits visitors without accounts: turn off **Verify JWT** for this function (the legacy JWT verification setting). The CLI equivalent is `supabase functions deploy say-hi --project-ref YOUR_NEW_PROJECT_REF --no-verify-jwt`. Deploying is an owner action; no deployment has been performed here.
5. The code uses Supabase's built-in server environment variables `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Never copy the service role key into frontend files. Optional function secret `SITE_ORIGIN` defaults to `https://tradersamz.lol`; it must exactly match the website origin, with no trailing slash. For local testing set it to your local preview origin, then restore the production origin before publishing.
6. Copy the function URL (ending `/functions/v1/say-hi`) into the empty string in `hello-config.js`. This public URL is the ONLY frontend configuration; no publishable key is needed for this public Edge Function.
7. Preview from the allowed origin. Open Say Hi!: it should show 0. Click once, then open in a second browser: both should show the same total. Close/minimize it to stop polling. Verify failed requests do not display confirmed increments. Your local test clicks are real shared clicks, not disposable browser state.
8. Publish the website only when ready. It remains on its existing static host; the database/function live separately in the new Supabase project.

## Security and limits

Anonymous and logged-in browser roles have no direct table or function permissions. Only the server's service role can read or invoke the increment. The SQL function locks the singleton row and increments atomically. It accepts no user-supplied totals or reset operation. A shared ceiling of 300 accepted increments per minute bounds write abuse; repeated visitor clicks are allowed. Heavy traffic or bots can exhaust that shared allowance for everyone until the next minute. CORS/Origin checking prevents other browser origins, but bots can spoof Origin; this is a modest public guest-counter defense, not bot authentication. For heavier abuse add Turnstile verification at the Edge Function and budget alerts. No visitor IPs are collected or stored by this implementation.

The existing Python files in `server/` are an unused alternative now. Do not run both backends or expect their databases to synchronize.

## Troubleshooting

- Waiting for database connection: `hello-config.js` still has an empty URL.
- 401: function JWT verification remains enabled.
- 403/CORS: SITE_ORIGIN doesn't exactly match the browser's origin (www and bare domains differ).
- 503: run schema.sql in the same project as the function; check server environment and function logs without publishing secrets.
- 429: shared rate ceiling reached; wait for the next minute, then refresh.

Prepared code only: live Supabase SQL, function execution, CORS, and cross-browser persistence still need verification after provisioning.

References: https://supabase.com/docs/guides/functions/auth and https://supabase.com/docs/guides/database/functions
