# Website efficiency audit — November 10, 2026

## Scope and test conditions

Baseline: commit `c1fd7a5`, before this audit's changes. Read AGENTS.md and DESIGN.md first. This is a static HTML/CSS/vanilla-JavaScript desktop on GitHub Pages, with a separate Supabase Edge Function and database. No build pipeline or application package manifest exists.

Changes are local only. No push, deployment, hosting change, message submission, permission request to a camera/microphone, production counter increment, or live Supabase modification was performed during this audit. The original PNG remains in the repository.

Browser access returned “The browser access host is unavailable.” Playwright was not installed. Consequently there is **no measured browser waterfall, LCP, CLS, INP, long-task profile, idle CPU percentage, heap measurement, paint trace, or visual screenshot comparison**. No browser version or browser cache state can be reported. Do not interpret the simulations below as browser benchmarks.

Available verification used Node v23.11.0, jsdom 26, mocked document widths of 1280 and 390 pixels, and a mocked height of 900 pixels. jsdom does not render or calculate real element geometry. External resource loading was disabled. All counter, crypto, and contact fetches in tests were mocked. Temporary test packages were installed under `/private/tmp/tradersamz-performance`, not in the website. No production dependency or build tool was added.

HTTP checks used curl against public assets, with redirects followed and content compression requested. These were single samples without browser cache, throttling, or a controlled mobile user agent. Byte counts exclude headers, TLS, and redirect response bodies. CDN behavior may vary.

## What visitors actually load

- Before: HTML, styles.css, 98.css, the imported Google Fonts CSS and its selected fonts, desktop images, scripts.js, hello-config.js, hello.js, four additional external scripts, and the hidden game's iframe/stylesheet/script. Additional requests initiated inside third-party scripts require a browser waterfall to enumerate.
- After: the four unused external scripts are absent. The three game resources load only when Dragon Slayer first opens. Its iframe is retained on minimize, close, and reopen so progress survives. The game is event-driven: source inspection found no animation loop, timer, audio, or camera activity requiring suspension.
- The font CSS now has a head link instead of a styles.css import. This removes the dependency on downloading/parsing styles.css to discover it. VT323 regular 400 and `display=swap` are unchanged. Font family, cascade order relative to project styling and 98.css, and the existing final Arial copy styles remain intact.
- Social content is copied from local HTML when first opened. A single intentional 1.5-second loading feedback timeout remains. Its avatar and decorative GIF are preserved. No recurring social fetch loop exists.
- Music and Player currently display “Coming Soon”; no audio element or playback engine exists on this page. TS Visualizer is an external destination; its application was not changed.
- Crypto fetches occur on demand, not periodically. Concurrent opens/refreshes now share one pending request. Its five-second abort timer is cleared on success **and failure**. Existing ten-second cooldown behavior remains.
- Say Hi! uses its existing public URL, raw fetch, private server credentials, SQL singleton row lock, validation, and shared rate limit. No Supabase browser SDK was added.
- app.py, the unused Python counter alternative, original images, docs, tests, and Git data are repository contents; they are not all fetched by visitors. Repository size is not an estimate of browser memory.

## Priorities and implementation

1. **High impact, high confidence, low regression risk:** remove React 17 development, ReactDOM 17 development, MediaPipe Hands, and Google reCAPTCHA scripts. No active JavaScript references their APIs. About text mentioning React/MediaPipe is content, not a runtime dependency. Camera markup is commented out; its dormant function uses native media APIs and a separate Python endpoint. The contact form has no reCAPTCHA widget or token integration; its existing form endpoint and fields are preserved. 98.css remains in use and retains its license attribution.
2. **High confidence:** defer game creation/navigation until the first open. All launch paths reach the same existing window function; reopening retains the frame. Added an accessible iframe title. Three resource requests and 11,441 uncompressed source bytes move out of initial load; this is source accounting, not measured browser transfer savings.
3. **High confidence:** stop clock timers while the document is hidden and schedule at minute boundaries while visible. The clock displays no seconds. Restore immediately updates the displayed time. Remove the document's unload listener: document-owned listeners are collected normally and remain available when a browser restores a cached page. No bfcache hit-rate improvement was measured.
4. **High confidence:** initialize About tabs only once, rather than attaching eight new listeners per reopening. Tab selection is preserved across reopening instead of silently resetting it. Keyboard arrow navigation remains active.
5. **Moderate regression risk, isolated tests pass:** drag handlers retain current clamping and desktop-only dragging, cache geometry at gesture start, and coalesce moves into a requestAnimationFrame callback. Release flushes the final pointer position; cancellation, resize, and hiding end the gesture. Real rendered drag smoothness and bounds still require browser QA.
6. **High confidence:** losslessly recompress the DBD PNG into a new asset, and reference that same URL in both places. All non-IDAT chunks, dimensions, metadata, and decompressed image bytes are identical. CRC checks pass. Original retained; repository disk size grows by the derivative's size, while visitor image downloads shrink. No downscaling, color quantization, format conversion, or image-quality tradeoff.
7. **High confidence with a freshness tradeoff:** counter polling now waits 30 seconds after a request completes, rather than using a 15-second interval. Opening/restoring reads immediately; a successful click updates immediately. Other visitors' changes can take about 30 seconds plus network latency to appear. Approximate steady visible-idle ceiling changes from 240 to 120 scheduled reads/hour, excluding opening/restoring reads and clicks. This is calculated, not production traffic measurement.

Counter reads disable clicking and writes reject input while reading, fixing the previous possibility of a GET and POST overlapping. No timer is scheduled during a request. Hiding/minimizing/closing aborts a pending GET and stops future polling. Pending writes are allowed to finish, never automatically retried, and only display confirmed totals. Ambiguous writes leave the button disabled until a later successful GET. A quick reopen during an aborted read queues an immediate replacement read. Invalid totals never replace a confirmed total. The small MutationObserver remains scoped to the greeting window.

CSS was reviewed, including later overrides, mobile rules, dynamic windows and reduced motion. No coverage-based selector deletion or visual redesign was attempted. Existing broad transitions are overridden for managed windows later in the stylesheet. Retro borders, typography, colors, decorative imagery, focus rules, and reduced motion rules are retained. No framework migration, minification step, service worker, or rewrite was introduced.

## Before/after evidence

### HTTP and file measurements

- Four removed external script bodies transferred **251,591 bytes total** in the curl samples: React 25,880; ReactDOM 207,816; MediaPipe 17,285; reCAPTCHA 610. All returned HTTP 200. Decoded source totals 1,092,028 bytes. Downstream third-party resources are excluded, so this is not a complete initial-page comparison. Removing the tags also removes their parsing/execution, but CPU and memory savings are unmeasured.
- Direct script tags in HTML: **7 → 3**. This removes four initial script fetches, plus any dependent fetches those scripts would initiate. Game HTML, CSS, and JS account for three further deferred requests. These are markup/resource-graph counts, not captured browser request counts.
- DBD PNG: **1,518,289 → 1,437,505 bytes**, saving **80,784 bytes (5.32%)**. Public-host HEAD returned `Content-Type: image/png`, `Content-Length: 1518289`, `Cache-Control: max-age=600`, and no Content-Encoding despite requesting compressed responses. This supports using raw PNG size for this host. Applying outer gzip locally would make the new file larger than outer-gzipping the original (1,425,260 vs 1,388,385 bytes); revisit the choice if PNG response compression changes.
- index.html: **41,766 → 41,636 bytes**; local gzip estimate **8,101 → 8,080**.
- scripts.js: **29,213 → 29,579 bytes**; local gzip estimate **6,623 → 6,959**.
- styles.css: **26,537 → 26,460 bytes**; local gzip estimate **5,446 → 5,399**.
- hello.js: **2,674 → 3,584 bytes**; local gzip estimate **1,142 → 1,370**.
- Maintained source grows slightly to implement lifecycle correctness. Its combined local gzip size grows by 496 bytes. These gzip sizes use Python gzip with a fixed timestamp and are **not observed wire sizes**. This is intentionally not an optimization for line count.

### Deterministic before/after DOM simulation

Same jsdom/Node harness, same 1280×900 mock dimensions, same sequence; baseline is read from Git. No rendering or network occurs.

- Scheduled clock callbacks during 60 visible seconds: **60 → 1**.
- Scheduled clock callbacks during the next 60 hidden seconds: **60 → 0**.
- Total About-tab listeners after initialization and 21 opens: **176 → 8**.
- Geometry getter reads inside a burst of 100 mousemove handlers: **400 → 0**. New code reads bounds at gesture start, outside this count.
- Scheduled drag animation frames during that burst: **0 → 1**. Baseline wrote position on every event; new code coalesces until a frame/release. Separate test verifies the final position survives release.

These results demonstrate removal of work in the harness. They do not quantify browser CPU time, forced-layout duration, memory retention, or frame rate.

## Verification and reproduction

Install test-only tooling outside the site, then run from the repository root:

```sh
npm install --prefix /private/tmp/tradersamz-performance --no-audit --no-fund --package-lock=false jsdom@26
JSDOM_PATH=/private/tmp/tradersamz-performance/node_modules/jsdom node --test tests/frontend.cjs
JSDOM_PATH=/private/tmp/tradersamz-performance/node_modules/jsdom node tests/measure-performance.cjs
python3 -m unittest discover -s tests -v
node --check scripts.js
node --check hello.js
git diff --check
```

Frontend tests cover window reuse, taskbar uniqueness, opening/closing/minimizing/maximizing/restoring, Start menu and both project categories at both mock widths; keyboard tab navigation; tab listener stability; visibility/clock lifecycle; drag coalescing/final position; game deferral and iframe reuse; counter visibility, pending requests, validation, confirmation and ambiguous failure; crypto success/error/deduplication/timeout cleanup; mocked contact submission; social content insertion; and game store/combat interactions.

Final results: **10/10 frontend tests and 4/4 existing Python tests pass**. The before/after measurement script, JavaScript syntax checks, local asset and anchor comparison, PNG equality/CRC verification, and `git diff --check` also pass.

All anchor destinations are unchanged versus baseline; all referenced local HTML assets exist. PNG equality/CRC checks pass. Existing Python tests pass for isolated atomic increments, persistence, rate-limit recovery, and request validation. **Those Python tests exercise the unused legacy backend, not live Supabase or PostgreSQL.** Supabase handler/schema/credentials/configuration were not modified. No production mutation was used for verification.

Desktop/mobile tests exercise DOM behavior, not actual mobile layout, touch hardware, focus appearance, screen readers, images, fonts, network errors in a real browser, or console output from third parties. Visual identity is preserved by limited code changes and exact PNG image-data equality; rendered equivalence remains unverified.

## Remaining bottlenecks and next steps

- The DBD icon is still 1254×1254 for a roughly icon-sized placement. A smaller derivative could substantially reduce downloads and decoded image memory, but choosing a resolution/format requires rendered comparison at high device pixel ratios. Keep the original and compare lossless WebP/PNG and carefully encoded alternatives before adopting one.
- 98.css, Google Fonts and their fonts remain third-party resources. Pinning or self-hosting should follow a verified version/license audit and rendered comparison; this pass does not claim they are unused. Font CSS discovery improves, but no load-time reduction was measured.
- Say Hi! remains one database read per visible poll plus one atomic write per accepted click. Realtime connections or caching introduce different costs and consistency behavior; no evidence here justifies adding them.
- Hidden About/MySpace image loading, decoded image lifetime, window paint costs, and the retained game frame's actual memory need browser profiling. The one-time social loading timeout and intentional decorative GIF are preserved. No audio/camera pipeline runs from the active markup.
- GitHub Pages controls cache headers; this project cannot tune them with a generic `.htaccess` file. Updated local script/CSS URLs use a revision query to avoid mixing cached old scripts with new markup. That is update correctness, not a claim of immutable caching. Social-preview URLs remain publicly addressable and unchanged in this audit.
- No unrelated source, originals, or legacy service files were deleted. Possible cleanup candidates are dormant camera code and the unused Python backend, but deleting them would need a separate scope decision and would not directly reduce currently requested browser bytes.
- Before publishing, use an available browser to compare cold/warm runs at desktop/mobile widths, keyboard/focus, real dragging/resizing, game continuity, and all windows. Inspect console/network, capture Performance and Memory traces, test back/forward restoration, and verify zero greeting requests while closed/hidden. No hosting or Supabase configuration changes are required for these local optimizations.

## Primary research

- [web.dev: Remove unused code](https://web.dev/articles/remove-unused-code) — remove unused libraries after checking actual consumers; applied to the four verified unused scripts.
- [web.dev: Lazy-load iframes](https://web.dev/articles/iframe-lazy-loading) — defer iframe resource costs. This site uses explicit first-open loading to make the hidden desktop feature lifecycle deterministic.
- [MDN: Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) — visibility events support stopping hidden-page work; applied to clock and greeting polling.
- [MDN: requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) — schedule visual updates with browser repaint; applied to drag writes.
- [Chrome: Page Lifecycle API](https://developer.chrome.com/docs/web-platform/page-lifecycle-api) and [MDN: bfcache blocking reasons](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Monitoring_bfcache_blocking_reasons) — remove unnecessary unload cleanup, retain restore-capable listeners. Actual cache eligibility remains untested.
- [MDN: script element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script) — execution order matters. Existing local scripts stay at the document end and in order; moving them to the head with defer has no established advantage here.
- [Supabase: Edge Function limits](https://supabase.com/docs/guides/functions/limits) — finite execution/resources support avoiding unnecessary polling; no plan-specific cost or production usage measurement is claimed.
