// Shared Supabase service. No local fallback and no automatic POST retry.
document.addEventListener('DOMContentLoaded', () => {
    const win = document.getElementById('hiWindow');
    const total = document.getElementById('hiTotal');
    const button = document.getElementById('hiButton');
    const status = document.getElementById('hiStatus');
    let timer, busy = false, reading = false, visible = false, latest = -1;
    const show = value => {
        if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid total');
        latest = Math.max(latest, value);
        total.textContent = latest.toLocaleString();
    };
    async function request(method) {
        const endpoint = window.SAY_HI_ENDPOINT;
        if (!endpoint) throw new Error('Say Hi! is not connected yet.');
        const response = await fetch(endpoint, {method, cache: 'no-store', headers: method === 'POST' ? {'Content-Type': 'application/json'} : {}, ...(method === 'POST' ? {body: '{}'} : {}), signal: AbortSignal.timeout(10000)});
        if (!response.ok) throw new Error(response.status === 429 ? 'Please slow down and try again shortly.' : 'Shared counter unavailable.');
        return (await response.json()).total;
    }
    async function refresh() {
        if (busy || reading) return;
        reading = true;
        try { show(await request('GET')); button.disabled = false; status.textContent = ''; }
        catch { button.disabled = true; status.textContent = window.SAY_HI_ENDPOINT ? 'Cannot connect to the shared counter. Retrying automatically…' : 'Say Hi! is waiting for its shared database connection.'; }
        finally { reading = false; }
    }
    button.addEventListener('click', async () => {
        if (busy || button.disabled) return;
        let confirmed = false;
        busy = true; button.disabled = true; status.textContent = 'Sending your hello…';
        try { show(await request('POST')); confirmed = true; status.textContent = 'Hello received. Thank you!'; }
        catch (error) { status.textContent = `${error.message} Your hello could not be confirmed. Waiting for the next automatic update before trying again.`; }
        finally { busy = false; button.disabled = !confirmed; }
    });
    function sync() {
        const next = getComputedStyle(win).display !== 'none' && !document.hidden;
        if (next === visible) return;
        visible = next; clearInterval(timer);
        if (visible) { refresh(); timer = setInterval(refresh, 15000); }
    }
    new MutationObserver(sync).observe(win, {attributes: true, attributeFilter: ['style', 'class']});
    document.addEventListener('visibilitychange', sync); sync();
});
