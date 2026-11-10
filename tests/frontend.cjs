// Isolated DOM tests. See PERFORMANCE.md for the temporary jsdom setup.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {resolve} = require('node:path');
const {JSDOM} = require(process.env.JSDOM_PATH || 'jsdom');
const root = resolve(__dirname, '..');
const read = name => readFileSync(resolve(root, name), 'utf8');
const settle = () => new Promise(resolve => setImmediate(resolve));

async function fixture(width = 1280) {
    // No resources option: external scripts, images, styles and frames never load.
    const dom = new JSDOM(read('index.html'), {url: 'https://test.invalid/', runScripts: 'outside-only'});
    const w = dom.window, d = w.document;
    await new Promise(resolve => d.addEventListener('DOMContentLoaded', resolve, {once: true}));
    let hidden = false, id = 0;
    const timers = new Map(), frames = new Map(), requests = [], errors = [];
    Object.defineProperty(d, 'hidden', {get: () => hidden});
    Object.defineProperty(d.documentElement, 'clientWidth', {value: width});
    Object.defineProperty(d.documentElement, 'clientHeight', {value: 900});
    d.querySelectorAll('.window').forEach(el => { el.style.display = 'none'; });
    w.setTimeout = (fn, delay) => { timers.set(++id, {fn, delay}); return id; };
    w.clearTimeout = key => timers.delete(key);
    w.setInterval = () => { throw Error('Unexpected perpetual interval'); };
    w.requestAnimationFrame = fn => { frames.set(++id, fn); return id; };
    w.cancelAnimationFrame = key => frames.delete(key);
    w.AbortController = AbortController;
    w.AbortSignal = AbortSignal;
    w.fetch = async (url, options) => {
        requests.push({url, ...options});
        return {ok: true, json: async () => ({total: 10})};
    };
    w.console.error = (...args) => errors.push(args);
    w.addEventListener('error', e => { errors.push(e.error); e.preventDefault(); });
    w.SAY_HI_ENDPOINT = 'https://counter.invalid/';
    w.eval(read('scripts.js'));
    w.eval(read('hello.js'));
    d.dispatchEvent(new w.Event('DOMContentLoaded'));
    const click = selector => { const el = d.querySelector(selector); assert.ok(el, selector); el.click(); return el; };
    const visibility = async value => {
        hidden = value; d.dispatchEvent(new w.Event('visibilitychange')); await settle();
    };
    return {dom, w, d, timers, frames, requests, errors, click, visibility};
}

for (const width of [1280, 390]) test(`window lifecycle and navigation at ${width}px`, async () => {
    const f = await fixture(width);
    const {d, click, dom, errors} = f;
    try {
        click('.start-button'); assert.equal(d.querySelector('.start-menu').style.display, 'flex');
        click('.start-menu [data-window="projects"]');
        for (const name of ['readyProjects', 'installProjects']) {
            click(`#projectsWindow [data-window="${name}"]`);
            assert.equal(d.getElementById(`${name}Window`).style.display, 'block');
        }
        for (let i = 0; i < 15; i++) {
            click('.desktop [data-window="projects"]');
            const win = d.getElementById('projectsWindow');
            click('#projectsWindow .max-btn'); assert.ok(win.classList.contains('maximized'));
            click('#projectsWindow .max-btn'); assert.ok(!win.classList.contains('maximized'));
            click('#projectsWindow .min-btn'); assert.equal(win.style.display, 'none');
            click('.taskbar-button[data-window-id="projectsWindow"]'); assert.equal(win.style.display, 'block');
            assert.equal(d.querySelectorAll('.taskbar-button[data-window-id="projectsWindow"]').length, 1);
            click('#projectsWindow .close-btn');
        }
        click('.desktop [data-window="about"]');
        const tabs = d.querySelectorAll('#aboutWindow .window-body a[href^="#"]');
        tabs[0].dispatchEvent(new f.w.KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}));
        assert.equal(d.activeElement, tabs[1]); assert.ok(tabs[1].classList.contains('active'));
        click('.desktop [data-window="social"]');
        click('#ieWindow .close-btn'); click('.desktop [data-window="social"]');
        assert.equal(d.querySelectorAll('#ieWindow').length, 1);
        assert.equal(d.querySelectorAll('.taskbar-button[data-window-id="ieWindow"]').length, 1);
        const frame = d.querySelector('#gameWindow iframe');
        assert.equal(frame.getAttribute('src'), null);
        click('.desktop [data-window="game"]');
        assert.equal(frame.getAttribute('src'), '/game/game.html');
        click('#gameWindow .close-btn'); click('.desktop [data-window="game"]');
        assert.equal(d.querySelector('#gameWindow iframe'), frame);
        assert.equal(frame.hasAttribute('data-src'), false);
        assert.deepEqual(errors, []);
    } finally { dom.window.close(); }
});

test('About listeners stay constant across reopen; minute clock stops when hidden', async () => {
    const f = await fixture();
    try {
        const tab = f.d.querySelector('#aboutWindow .window-body a');
        let added = 0;
        const add = tab.addEventListener.bind(tab);
        tab.addEventListener = (...args) => { added++; return add(...args); };
        for (let i = 0; i < 20; i++) { f.click('.desktop [data-window="about"]'); f.click('#aboutWindow .close-btn'); }
        assert.equal(added, 0);
        assert.equal(f.timers.size, 1);
        assert.ok([...f.timers.values()][0].delay <= 60000);
        await f.visibility(true); assert.equal(f.timers.size, 0);
        await f.visibility(false); assert.equal(f.timers.size, 1);
        assert.equal(f.requests.length, 0);
    } finally { f.dom.window.close(); }
});

test('drag events coalesce into one frame and release preserves final position', async () => {
    const f = await fixture();
    try {
        f.click('.desktop [data-window="about"]');
        const win = f.d.getElementById('aboutWindow');
        win.querySelector('.title-bar').dispatchEvent(new f.w.MouseEvent('mousedown', {bubbles: true, clientX: 10, clientY: 10}));
        for (let i = 0; i < 100; i++) f.d.dispatchEvent(new f.w.MouseEvent('mousemove', {bubbles: true, cancelable: true, clientX: i + 10, clientY: i + 10}));
        assert.equal(f.frames.size, 1);
        f.d.dispatchEvent(new f.w.MouseEvent('mouseup', {bubbles: true}));
        assert.equal(f.frames.size, 0);
        assert.equal(win.style.left, '99px'); assert.equal(win.style.top, '99px');
    } finally { f.dom.window.close(); }
});

test('counter has no hidden work, serializes reads/writes and never retries ambiguous writes', async () => {
    const f = await fixture();
    try {
        const {w, d, click, timers, requests} = f;
        assert.equal(requests.length, 0);
        let finishRead;
        w.fetch = (url, opts) => {
            requests.push({url, ...opts});
            return new Promise(resolve => { finishRead = () => resolve({ok: true, json: async () => ({total: 10})}); });
        };
        click('.desktop [data-window="hi"]'); await settle();
        click('#hiButton'); assert.equal(requests.length, 1);
        finishRead(); await settle();
        assert.equal(d.getElementById('hiTotal').textContent, '10');
        assert.equal(d.getElementById('hiStatus').textContent, '');
        assert.ok([...timers.values()].some(t => t.delay === 30000));
        let rejectWrite;
        w.fetch = (url, opts) => {
            requests.push({url, ...opts});
            return new Promise((_, reject) => { rejectWrite = reject; });
        };
        click('#hiButton'); click('#hiButton');
        assert.equal(requests.filter(r => r.method === 'POST').length, 1);
        rejectWrite(Error('Connection lost')); await settle();
        assert.ok(d.getElementById('hiButton').disabled);
        assert.match(d.getElementById('hiStatus').textContent, /could not be confirmed/);
        assert.equal(d.getElementById('hiTotal').textContent, '10');
        click('#hiWindow .close-btn'); await settle();
        assert.equal(timers.size, 1); // Only the visible-page clock remains.
        await f.visibility(true); assert.equal(timers.size, 0);
        assert.equal(requests.filter(r => r.method === 'POST').length, 1);
    } finally { f.dom.window.close(); }
});

test('hiding counter aborts pending GET and reopening reconnects', async () => {
    const f = await fixture();
    try {
        let signal;
        f.w.fetch = (_, options) => {
            signal = options.signal;
            return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(Error('Aborted'))));
        };
        f.click('.desktop [data-window="hi"]'); await settle();
        f.click('#hiWindow .min-btn'); await settle();
        assert.equal(signal.aborted, true);
        f.w.fetch = async () => ({ok: true, json: async () => ({total: 12})});
        f.click('.taskbar-button[data-window-id="hiWindow"]'); await settle();
        assert.equal(f.d.getElementById('hiTotal').textContent, '12');
        assert.equal(f.d.getElementById('hiButton').disabled, false);
    } finally { f.dom.window.close(); }
});

test('counter validates totals and only confirms a successful write', async () => {
    const f = await fixture();
    try {
        f.click('.desktop [data-window="hi"]'); await settle();
        f.w.fetch = async () => ({ok: true, json: async () => ({total: 11})});
        f.click('#hiButton'); await settle();
        assert.equal(f.d.getElementById('hiTotal').textContent, '11');
        assert.match(f.d.getElementById('hiStatus').textContent, /Hello received/);
        f.w.fetch = async () => ({ok: true, json: async () => ({total: -1})});
        const poll = [...f.timers].find(([, t]) => t.delay === 30000);
        f.timers.delete(poll[0]); poll[1].fn(); await settle();
        assert.equal(f.d.getElementById('hiTotal').textContent, '11');
        assert.equal(f.d.getElementById('hiButton').disabled, true);
        assert.match(f.d.getElementById('hiStatus').textContent, /Cannot connect/);
        await f.visibility(true);
        assert.equal(f.timers.size, 0);
    } finally { f.dom.window.close(); }
});

test('crypto requests deduplicate and failed requests release their timeout', async () => {
    const f = await fixture();
    try {
        let reject, calls = 0;
        f.w.fetch = () => { calls++; return new Promise((_, fail) => { reject = fail; }); };
        f.w.fetchCryptoPrices(); f.w.fetchCryptoPrices(); f.w.fetchCryptoPrices();
        assert.equal(calls, 1);
        reject(Error('Offline')); await settle();
        assert.equal(f.timers.size, 1); // Only clock.
        assert.match(f.d.getElementById('cryptoPrices').textContent, /Offline/);
        f.w.fetch = async () => ({ok: true, json: async () => ({bitcoin: {usd: 123, usd_24h_change: 2}})});
        await f.w.fetchCryptoPrices();
        assert.match(f.d.getElementById('cryptoPrices').textContent, /Bitcoin/);
    } finally { f.dom.window.close(); }
});

test('contact submission is intercepted and sends only to a mock', async () => {
    const f = await fixture();
    try {
        f.w.fetch = async (url, options) => {
            assert.equal(url, f.d.getElementById('contactForm').action);
            assert.equal(options.method, 'POST');
            return {ok: true};
        };
        const event = new f.w.Event('submit', {bubbles: true, cancelable: true});
        f.d.getElementById('contactForm').dispatchEvent(event);
        await settle(); assert.equal(event.defaultPrevented, true);
        assert.match(f.d.getElementById('formStatus').textContent, /successfully/);
    } finally { f.dom.window.close(); }
});

test('social content loads locally and the game remains playable', async () => {
    const f = await fixture();
    try {
        f.click('.desktop [data-window="social"]');
        const load = [...f.timers].find(([, t]) => t.delay === 1500);
        f.timers.delete(load[0]); load[1].fn();
        assert.match(f.d.querySelector('#ieWindow .ie-content').textContent, /Current Favorites/);
        assert.ok(f.d.querySelector('#ieWindow .last-updated-time').textContent.length > 1);
        const game = new JSDOM(read('game/game.html'), {runScripts: 'outside-only'});
        try {
            game.window.eval(read('game/game.js'));
            const d = game.window.document;
            d.getElementById('button1').click(); // Store.
            d.getElementById('button1').click(); // Buy health.
            assert.equal(String(d.getElementById('healthText').innerText), '110');
            assert.equal(String(d.getElementById('goldText').innerText), '40');
            d.getElementById('button3').click(); // Town square.
            d.getElementById('button2').click(); // Cave.
            d.getElementById('button1').click(); // Fight slime.
            assert.equal(d.getElementById('monsterStats').style.display, 'block');
        } finally { game.window.close(); }
    } finally { f.dom.window.close(); }
});
