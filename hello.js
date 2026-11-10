// Shared Supabase service. No local fallback and no automatic POST retry.
document.addEventListener('DOMContentLoaded', () => {
    const win = document.getElementById('hiWindow');
    const total = document.getElementById('hiTotal');
    const button = document.getElementById('hiButton');
    const status = document.getElementById('hiStatus');
    const pollDelay = 30000;
    let timer, readController, busy = false, reading = false, visible = false, refreshOnReadEnd = false, latest = -1;
    function scheduleRefresh() {
        clearTimeout(timer);
        if (visible && !busy && !reading) timer = setTimeout(refresh, pollDelay);
    }
    const show = value => {
        if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid total');
        latest = Math.max(latest, value);
        total.textContent = latest.toLocaleString();
    };
    async function request(method, signal = AbortSignal.timeout(10000)) {
        const endpoint = window.SAY_HI_ENDPOINT;
        if (!endpoint) throw new Error('Say Hi! is not connected yet.');
        const response = await fetch(endpoint, {method, cache: 'no-store', headers: method === 'POST' ? {'Content-Type': 'application/json'} : {}, ...(method === 'POST' ? {body: '{}'} : {}), signal});
        if (!response.ok) throw new Error(response.status === 429 ? 'Please slow down and try again shortly.' : 'Shared counter unavailable.');
        return (await response.json()).total;
    }
    async function refresh() {
        if (!visible || busy || reading) return;
        clearTimeout(timer);
        reading = true;
        button.disabled = true;
        const controller = readController = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try { show(await request('GET', controller.signal)); button.disabled = false; status.textContent = ''; }
        catch {
            button.disabled = true;
            if (visible) status.textContent = window.SAY_HI_ENDPOINT ? 'Cannot connect to the shared counter. Retrying automatically…' : 'Say Hi! is waiting for its shared database connection.';
        }
        finally {
            clearTimeout(timeout);
            readController = null;
            reading = false;
            if (visible && refreshOnReadEnd) {
                refreshOnReadEnd = false;
                refresh();
            } else scheduleRefresh();
        }
    }
    button.addEventListener('click', async () => {
        if (busy || reading || button.disabled) return;
        clearTimeout(timer);
        let confirmed = false;
        busy = true; button.disabled = true; status.textContent = 'Sending your hello…';
        try { show(await request('POST')); confirmed = true; status.textContent = 'Hello received. Thank you!'; }
        catch (error) { status.textContent = `${error.message} Your hello could not be confirmed. Waiting for the next automatic update before trying again.`; }
        finally { busy = false; button.disabled = !confirmed; scheduleRefresh(); }
    });
    function sync() {
        const next = getComputedStyle(win).display !== 'none' && !document.hidden;
        if (next === visible) return;
        visible = next; clearTimeout(timer);
        refreshOnReadEnd = visible && reading;
        if (visible) refresh();
        else readController?.abort(); // Only reads are cancelled; never retry an ambiguous write.
    }
    new MutationObserver(sync).observe(win, {attributes: true, attributeFilter: ['style', 'class']});
    document.addEventListener('visibilitychange', sync); sync();
});
