> Legacy alternative: the frontend now targets Supabase. Follow `supabase/SETUP.md` for the current setup. This Python service is not connected.

# Shared Say Hi counter

The site currently uses static hosting (CNAME: tradersamz.lol). Static hosting cannot run this API. Nothing has been deployed. The frontend deliberately reports a connection error until `/api/hi` is routed to this service; it never fabricates a local total.

Run Python 3.10+ on a persistent host:

```
COUNTER_DB=/var/lib/samantha/hello.sqlite3 COUNTER_ORIGIN=https://tradersamz.lol python3 server/counter.py
```

Create the storage directory with service-user write access. Use a process supervisor and back up the SQLite file. The `/tmp` default is for local tests only. Keep the database outside the static document root and off ephemeral storage. Initial total is zero; restarting with the same database preserves it. Do not delete/reset it during deployments.

Route exactly `/api/hi` from the website's HTTPS origin to `127.0.0.1:8001` using an HTTPS reverse proxy (or an edge proxy in front of the existing static host). Overwrite `X-Real-IP` with the trusted client IP, strip untrusted incoming values, limit request bodies and apply proxy timeouts. Never expose the loopback service directly. No privileged frontend credentials are needed. If static hosting remains on GitHub Pages, an edge proxy or separate API hosting plus an explicitly configured same-origin route is required.

Storage uses SQLite transactions with BEGIN IMMEDIATE and a server-side `total=total+1`, so simultaneous requests serialize correctly. Only an empty JSON object is accepted; clients cannot set a total or reset it. Strict Origin validation rejects cross-site browser submissions. A persistent 60-click/minute/IP limit allows repeated human clicks; visitors sharing an IP share that allowance. Origin checks do not authenticate bots; use edge rate limits for heavier abuse.

Frontend allows one pending increment at a time, disables during the request, never automatically retries POST, and reports ambiguous network failures without confirming a click. GET refreshes on opening/restoring and 30 seconds after each completed request while visible. Total is not an ARIA live region; short status feedback is polite.

Required owner decision: choose a persistent Python host and same-origin HTTPS proxy, then configure COUNTER_DB, COUNTER_ORIGIN, client IP forwarding, and backups. Local development can proxy /api/hi to this service with origin http://localhost:8000.

Tests: `python3 -m unittest discover -s tests -v`.
