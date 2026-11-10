// Deterministic DOM simulation, not browser profiling. See PERFORMANCE.md.
const {JSDOM}=require(process.env.JSDOM_PATH || 'jsdom');
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname, '..');
const {execFileSync}=require('node:child_process');
const baseline=process.env.PERFORMANCE_BASE_REF || 'c1fd7a5927760f8e8e6e8f699c40d03d3bab707c';
(async()=>{
 for(const before of [true,false]){
  const read=name=>before ? execFileSync('git',['show',`${baseline}:${name}`],{cwd:root,encoding:'utf8'}) : fs.readFileSync(path.join(root,name),'utf8');
  const dom=new JSDOM(read('index.html'),{url:'https://test.invalid/',runScripts:'outside-only'});
  const w=dom.window,d=w.document;
  await new Promise(r=>d.addEventListener('DOMContentLoaded',r,{once:true}));
  d.querySelectorAll('.window').forEach(el=>el.style.display='none');
  let hidden=false,now=0,id=0,callbacks=0,tabListeners=0,geometryReads=0;
  const RealDate=Date;
  w.Date=class extends RealDate {constructor(...args){super(...(args.length?args:[now]));} static now(){return now;}};
  Object.defineProperty(d,'hidden',{get:()=>hidden});
  Object.defineProperty(d.documentElement,'clientWidth',{get:()=>{geometryReads++;return 1280;}});
  Object.defineProperty(d.documentElement,'clientHeight',{get:()=>{geometryReads++;return 900;}});
  const tasks=new Map(),frames=new Map();
  w.setTimeout=(fn,ms)=>{tasks.set(++id,{fn,time:now+ms});return id;};
  w.clearTimeout=w.clearInterval=key=>tasks.delete(key);
  w.setInterval=(fn,ms)=>{tasks.set(++id,{fn,time:now+ms,interval:ms});return id;};
  w.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};w.cancelAnimationFrame=key=>frames.delete(key);
  const tabs=d.querySelectorAll('#aboutWindow .window-body a[href^="#"]');
  for(const tab of tabs){const add=tab.addEventListener.bind(tab);tab.addEventListener=(...args)=>{tabListeners++;return add(...args);};}
  w.eval(read('scripts.js'));d.dispatchEvent(new w.Event('DOMContentLoaded'));
  const advance=ms=>{const end=now+ms;while(true){const next=[...tasks].sort((a,b)=>a[1].time-b[1].time)[0];if(!next||next[1].time>end)break;const [key,t]=next;now=t.time;tasks.delete(key);if(t.interval)tasks.set(key,{...t,time:now+t.interval});callbacks++;t.fn();}now=end;};
  advance(60000);const foregroundCallbacks=callbacks;
  hidden=true;d.dispatchEvent(new w.Event('visibilitychange'));callbacks=0;advance(60000);const hiddenCallbacks=callbacks;
  hidden=false;d.dispatchEvent(new w.Event('visibilitychange')``);
  for(let i=0;i<20;i++){d.querySelector('.desktop [data-window="about"]').click();d.querySelector('#aboutWindow .close-btn').click();}
  d.querySelector('.desktop [data-window="about"]').click();
  const win=d.getElementById('aboutWindow');
  for(const key of ['offsetWidth','offsetHeight'])Object.defineProperty(win,key,{get:()=>{geometryReads++;return 600;}});
  win.querySelector('.title-bar').dispatchEvent(new w.MouseEvent('mousedown',{bubbles:true,clientX:10,clientY:10}));
  geometryReads=0;
  for(let i=0;i<100;i++)d.dispatchEvent(new w.MouseEvent('mousemove',{bubbles:true,cancelable:true,clientX:i+10,clientY:i+10}));
  console.log(JSON.stringify({version:before?'before':'after',foregroundCallbacksPerMinute:foregroundCallbacks,hiddenCallbacksPerMinute:hiddenCallbacks,tabListenersAfter21Opens:tabListeners,geometryReadsFor100Moves:geometryReads,pendingAnimationFrames:frames.size}));
  dom.window.close();
 }
})();
