/* ============================================================
   NewMusic — música ambiente gerada na hora (WebAudio).
   - Sem arquivo de áudio e sem direitos autorais: tudo é sintetizado aqui.
   - Cada loja tem um "tema" (andamento, acordes, bateria).
   - Pra tocar uma PLAYLIST DO SPOTIFY no lugar, preencha playlists:
       NewMusic.init('rua', { playlists: { rua: 'ID_DA_PLAYLIST' } })
     e aparece o botão 🎧 que abre o player do Spotify embutido.
   Uso:  <script src="../shared/music.js"></script>  +  NewMusic.init('rua')
   ============================================================ */
(function(){
  'use strict';
  const mtof = m => 440*Math.pow(2,(m-69)/12);

  const THEMES = {
    rua:     { label:'Rua NEW · lo-fi noturno',  bpm:74,  swing:.14, kind:'lofi',
               chords:[[57,60,64,67,71],[53,57,60,64,67],[50,53,57,60,64],[52,56,59,62,65]], bass:[45,41,38,40], lead:[69,72,74,76,79], crackle:true },
    mercado: { label:'NEW Mercado · groove leve', bpm:98,  swing:.08, kind:'bossa',
               chords:[[60,64,67,71],[57,60,64,67],[62,65,69,72],[55,59,62,65]], bass:[48,45,50,43], lead:[72,74,76,79,81] },
    roupas:  { label:'NEW Wear · deep house',     bpm:118, swing:0,   kind:'house',
               chords:[[53,56,60,63,67],[49,53,56,60,63],[56,60,63,67,70],[51,55,58,62,65]], bass:[41,37,44,39], lead:[65,68,72,75,77] },
    nex:     { label:'NEX · lo-fi tech',        bpm:84,  swing:.1,  kind:'lofi',
               chords:[[50,53,57,60,64],[46,50,53,57,60],[48,52,55,59,62],[43,47,50,54,57]], bass:[38,34,36,31], lead:[69,72,76,79,81] },
    pet:     { label:'NEW Pet · alegre',          bpm:104, swing:.06, kind:'bossa',
               chords:[[60,64,67],[65,69,72],[67,71,74],[57,60,64]], bass:[48,53,55,45], lead:[72,76,79,84] },
  };

  const M = { ctx:null, master:null, rev:null, noise:null, theme:null, themeId:null, timer:null, step:0, nextTime:0,
              playing:false, vol:.5, playlists:{}, spOpen:false };

  const store = { get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} } };

  function ensure(){
    if(M.ctx) return M.ctx;
    const AC = window.AudioContext||window.webkitAudioContext; if(!AC) return null;
    const c = new AC(); M.ctx = c;
    const comp = c.createDynamicsCompressor(); comp.threshold.value=-20; comp.ratio.value=3;
    const lp = c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=9500;
    M.master = c.createGain(); M.master.gain.value=0; M.master.connect(lp); lp.connect(comp); comp.connect(c.destination);
    const len = Math.floor(c.sampleRate*1.8), buf = c.createBuffer(2,len,c.sampleRate);
    for(let ch=0;ch<2;ch++){ const d=buf.getChannelData(ch); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6); }
    const conv = c.createConvolver(); conv.buffer=buf; const rg=c.createGain(); rg.gain.value=.4; conv.connect(rg); rg.connect(M.master); M.rev=conv;
    const nb = c.createBuffer(1,c.sampleRate,c.sampleRate), nd=nb.getChannelData(0); for(let i=0;i<nd.length;i++) nd[i]=Math.random()*2-1; M.noise=nb;
    return c;
  }

  /* ---------- vozes ---------- */
  function env(g,t,a,d,peak){ g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(.0001,t+a+d); }
  function tone(t,freq,type,d,v,o){ o=o||{}; const c=M.ctx, osc=c.createOscillator(), g=c.createGain(); osc.type=type; osc.frequency.value=freq; if(o.det) osc.detune.value=o.det;
    let out=osc; if(o.lp){ const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=o.lp; osc.connect(f); out=f; }
    env(g,t,o.a||.004,d,v); out.connect(g); g.connect(M.master);
    if(o.rev){ const r=c.createGain(); r.gain.value=o.rev; g.connect(r); r.connect(M.rev); }
    osc.start(t); osc.stop(t+d+(o.a||.004)+.05); }
  function hit(t,o){ const c=M.ctx, s=c.createBufferSource(); s.buffer=M.noise; const f=c.createBiquadFilter(); f.type=o.type||'highpass'; f.frequency.value=o.f||8000; f.Q.value=o.q||1;
    const g=c.createGain(); g.gain.setValueAtTime(o.v||.2,t); g.gain.exponentialRampToValueAtTime(.001,t+(o.d||.05)); s.connect(f); f.connect(g); g.connect(M.master);
    if(o.rev){ const r=c.createGain(); r.gain.value=o.rev; g.connect(r); r.connect(M.rev); } s.start(t,Math.random()*.5); s.stop(t+(o.d||.05)+.02); }
  function kick(t,v){ const c=M.ctx, o=c.createOscillator(), g=c.createGain(); o.type='sine'; o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(42,t+.12);
    g.gain.setValueAtTime(v||.9,t); g.gain.exponentialRampToValueAtTime(.001,t+.34); o.connect(g); g.connect(M.master); o.start(t); o.stop(t+.36); }
  function snare(t,v){ hit(t,{f:1800,type:'bandpass',d:.16,v:v||.4,q:.8,rev:.25}); tone(t,185,'triangle',.11,(v||.4)*.5); }
  function chord(t,notes,d,v,kind){
    notes.forEach((n,i)=>{ const f=mtof(n);
      if(kind==='lofi'){ tone(t,f,'triangle',d,v*.9,{a:.02,lp:1800,rev:.5,det:(i%2?6:-6)}); tone(t,f*2,'sine',d*.6,v*.35,{a:.01,lp:2400}); }
      else if(kind==='house'){ tone(t,f,'sawtooth',d,v*.35,{a:.05,lp:900+i*60,rev:.6,det:(i%2?8:-8)}); }
      else { tone(t,f,'triangle',d,v*.8,{a:.01,lp:2600,rev:.35}); } }); }

  /* ---------- sequenciador ---------- */
  function step16(step,t){
    const th=M.theme, sx=60/th.bpm/4, bar=Math.floor(step/16)%4, s=step%16, tt=t+((s%2)?th.swing*sx:0);
    if(th.kind==='lofi'){
      if(s===0||s===10) kick(tt,.9); if(s===4||s===12) snare(tt,.4);
      if(s%2===0) hit(tt,{f:7000,d:.04,v:s%4===0?.1:.06});
      if(s===0) chord(t,th.chords[bar],sx*15,.05,'lofi');
      if(s===0||s===6||s===10) tone(tt,mtof(th.bass[bar]),'sine',sx*(s===6?3:5),.28,{lp:420});
      if(s%4===2&&Math.random()<.35) tone(tt,mtof(th.lead[(Math.random()*th.lead.length)|0]),'sine',.5,.05,{lp:2500,rev:.7});
      if(th.crackle&&Math.random()<.35) hit(tt+Math.random()*sx,{f:5000,d:.01,v:.022});
    } else if(th.kind==='house'){
      if(s%4===0) kick(tt,.85); if(s===4||s===12) hit(tt,{f:1500,type:'bandpass',d:.12,v:.28,q:.7,rev:.3});
      if(s%4===2) hit(tt,{f:7500,d:.1,v:.1}); else if(s%2===1) hit(tt,{f:9000,d:.03,v:.04});
      if([2,3,6,10,11,14].includes(s)) tone(tt,mtof(th.bass[bar]),'sawtooth',sx*.9,.2,{lp:520});
      if(s===0) chord(t,th.chords[bar],sx*16,.05,'house');
      if(s===6||s===10) tone(tt,mtof(th.chords[bar][3]+12),'square',sx*1.5,.04,{lp:2200,rev:.5});
    } else {
      if(s===0||s===8) kick(tt,.7); if(s===11) kick(tt,.4);
      if([3,6,10,12,15].includes(s)) hit(tt,{f:2600,type:'bandpass',d:.04,v:.12,q:1.4});
      hit(tt,{f:9000,d:.03,v:.03+(s%4===0?.025:0)});
      if(s===0||s===6||s===10) chord(tt,th.chords[bar],sx*(s===0?5:3),.045,'bossa');
      if(s===0) tone(tt,mtof(th.bass[bar]),'sine',sx*7,.26,{lp:480}); if(s===8) tone(tt,mtof(th.bass[bar]+7),'sine',sx*7,.22,{lp:480});
      if(s%4===2&&Math.random()<.3) tone(tt,mtof(th.lead[(Math.random()*th.lead.length)|0]),'triangle',.35,.04,{lp:3000,rev:.5});
    }
  }
  function tick(){ const c=M.ctx, sx=60/M.theme.bpm/4; while(M.nextTime<c.currentTime+.25){ step16(M.step,M.nextTime); M.nextTime+=sx; M.step++; } }

  M.start = function(id){
    const th=THEMES[id||M.themeId]; if(!th) return; M.themeId=id||M.themeId; M.theme=th;
    const c=ensure(); if(!c) return; if(c.state==='suspended') c.resume();
    if(M.timer) clearInterval(M.timer);
    M.step=0; M.nextTime=c.currentTime+.1; M.timer=setInterval(tick,50);
    const now=c.currentTime; M.master.gain.cancelScheduledValues(now); M.master.gain.setValueAtTime(M.master.gain.value,now); M.master.gain.linearRampToValueAtTime(M.vol,now+1.2);
    M.playing=true; ui();
  };
  M.stop = function(fade){
    fade = fade==null?.5:fade; if(!M.ctx){ M.playing=false; ui(); return; }
    const c=M.ctx, now=c.currentTime; M.master.gain.cancelScheduledValues(now); M.master.gain.setValueAtTime(M.master.gain.value,now); M.master.gain.linearRampToValueAtTime(0,now+fade);
    M.playing=false; setTimeout(()=>{ if(!M.playing&&M.timer){ clearInterval(M.timer); M.timer=null; } },fade*1000+100); ui();
  };
  M.toggle = function(){ if(M.playing){ M.stop(); store.set('newmusic_off','1'); } else { closeSpotify(); M.start(); store.set('newmusic_off','0'); } };

  /* ---------- interface (pílula no canto) ---------- */
  let root=null, spWrap=null;
  function css(){ const s=document.createElement('style'); s.textContent=`
    #newmusic{position:fixed;right:16px;bottom:16px;z-index:7;display:flex;align-items:center;gap:10px;padding:8px 10px 8px 8px;background:rgba(18,18,24,.7);backdrop-filter:blur(16px) saturate(1.4);border:1px solid rgba(255,255,255,.14);border-radius:99px;box-shadow:0 10px 40px rgba(0,0,0,.35);font-family:"Segoe UI",system-ui,sans-serif;color:#f5f5f7;font-size:12.5px}
    #newmusic button{width:34px;height:34px;border-radius:50%;border:0;background:#8b5cf6;color:#fff;font-size:15px;cursor:pointer;display:grid;place-items:center;font-family:inherit}
    #newmusic button.sp{background:rgba(255,255,255,.14);color:#fff} #newmusic button:hover{filter:brightness(1.12)}
    #newmusic .nmt{line-height:1.25;max-width:190px} #newmusic .nmt b{display:block;font-size:12.5px} #newmusic .nmt small{opacity:.6;font-size:11px}
    #newmusic .eq{display:flex;gap:2px;align-items:flex-end;height:16px;width:16px} #newmusic .eq i{flex:1;background:#8b5cf6;border-radius:1px;height:30%}
    #newmusic.on .eq i{animation:nmeq .9s ease-in-out infinite} #newmusic.on .eq i:nth-child(2){animation-delay:.25s} #newmusic.on .eq i:nth-child(3){animation-delay:.5s}
    @keyframes nmeq{0%,100%{height:25%}50%{height:100%}}
    #nmsp{position:fixed;right:16px;bottom:70px;z-index:7;width:min(320px,90vw);border-radius:14px;overflow:hidden;display:none;box-shadow:0 10px 40px rgba(0,0,0,.5)} #nmsp.on{display:block}
    @media(max-width:560px){#newmusic .nmt{display:none}}`; document.head.appendChild(s); }
  function buildUI(){
    if(root) return; css();
    root=document.createElement('div'); root.id='newmusic';
    root.innerHTML='<button id="nmBtn" title="Música (M)">♪</button><div class="eq"><i></i><i></i><i></i></div><div class="nmt"><b></b><small>música ambiente · tecla M</small></div><button class="sp" id="nmSp" title="Playlist do Spotify" style="display:none">🎧</button>';
    document.body.appendChild(root);
    spWrap=document.createElement('div'); spWrap.id='nmsp'; document.body.appendChild(spWrap);
    for(const ev of ['mousedown','mouseup','click']) { root.addEventListener(ev,e=>e.stopPropagation()); spWrap.addEventListener(ev,e=>e.stopPropagation()); }
    root.querySelector('#nmBtn').onclick=()=>M.toggle();
    root.querySelector('#nmSp').onclick=()=>{ M.spOpen?closeSpotify():openSpotify(); };
    ui();
  }
  function openSpotify(){ const id=M.playlists[M.themeId]; if(!id) return; M.spOpen=true; if(M.playing) M.stop(.4);
    spWrap.innerHTML=`<iframe src="https://open.spotify.com/embed/playlist/${encodeURIComponent(id)}?utm_source=generator&theme=0" width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`; spWrap.classList.add('on'); }
  function closeSpotify(){ M.spOpen=false; if(spWrap){ spWrap.classList.remove('on'); spWrap.innerHTML=''; } }
  function ui(){ if(!root) return; root.classList.toggle('on',M.playing); root.querySelector('.nmt b').textContent=(M.theme||THEMES[M.themeId]||{label:'Música'}).label;
    root.querySelector('#nmBtn').textContent=M.playing?'❚❚':'♪'; root.querySelector('#nmSp').style.display=(M.playlists[M.themeId])?'grid':'none'; }

  M.init = function(id,opts){
    opts=opts||{}; M.themeId=id; M.theme=THEMES[id]; if(opts.volume!=null) M.vol=opts.volume; Object.assign(M.playlists,opts.playlists||{});
    buildUI();
    let started=false; const go=()=>{ if(started) return; started=true; if(store.get('newmusic_off')!=='1') M.start(id); };
    window.addEventListener('pointerdown',go,{capture:true}); window.addEventListener('keydown',go,{capture:true});
    window.addEventListener('keydown',e=>{ if(e.code==='KeyM'&&!/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||'')) M.toggle(); });
  };
  M.THEMES=THEMES; window.NewMusic=M;
})();
