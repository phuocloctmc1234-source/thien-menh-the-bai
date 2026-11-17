'use strict';
/* =========================================================
   TIỆN ÍCH
========================================================= */
const $=(s,r=document)=>r.querySelector(s);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
let toastT=0;
function toast(msg,ms=1800){const t=$('#toast');t.innerHTML=msg;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),ms)}
function banner(txt){const b=$('#banner');b.textContent=txt;b.classList.remove('on');void b.offsetWidth;b.classList.add('on')}

/* =========================================================
   ÂM THANH (tổng hợp bằng WebAudio, không cần file)
========================================================= */
const SFX=(()=>{
  let ac=null,on=true,nb=null;
  function A(){if(!ac){try{ac=new(window.AudioContext||window.webkitAudioContext)();const len=ac.sampleRate;nb=ac.createBuffer(1,len,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1}catch(e){on=false}}return ac}
  function tone(f,dur,type='sine',vol=.12,f2){if(!on)return;const a=A();if(!a)return;const t=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g).connect(a.destination);o.start(t);o.stop(t+dur+.02)}
  function noise(dur,vol=.2,freq=1200,type='bandpass'){if(!on)return;const a=A();if(!a)return;const t=a.currentTime,s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=nb;f.type=type;f.frequency.value=freq;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f).connect(g).connect(a.destination);s.start(t,Math.random()*.5,dur+.05)}
  return{
    unlock(){const a=A();if(a&&a.state==='suspended')a.resume()},
    toggle(){on=!on;return on},get on(){return on},
    card(){noise(.07,.1,5000)},
    slash(){noise(.14,.22,3800,'highpass');tone(1200,.08,'triangle',.03,500)},
    hit(){noise(.12,.25,1400);tone(160,.14,'square',.06,60)},
    big(){noise(.5,.4,500,'lowpass');tone(90,.5,'sine',.3,30)},
    block(){tone(500,.14,'triangle',.1,820);noise(.08,.06,7000,'highpass')},
    heal(){tone(520,.3,'sine',.08,1040);setTimeout(()=>tone(780,.25,'sine',.06,1300),90)},
    buff(){tone(300,.35,'sawtooth',.05,700);tone(450,.35,'triangle',.05,1000)},
    fire(){noise(.45,.3,600,'lowpass');tone(200,.3,'sawtooth',.04,80)},
    ice(){tone(1600,.18,'sine',.05,2600);noise(.22,.12,8000,'highpass')},
    zap(){tone(1200,.25,'sawtooth',.07,90);noise(.2,.18,3000)},
    dark(){tone(220,.45,'sawtooth',.06,70);tone(110,.45,'sine',.08,55)},
    poison(){tone(300,.2,'square',.04,500);setTimeout(()=>tone(260,.15,'square',.03,420),80)},
    coin(){tone(990,.08,'square',.05);setTimeout(()=>tone(1480,.14,'square',.05),70)},
    win(){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,.25,'triangle',.08),i*110))},
    lose(){[392,330,262,196].forEach((f,i)=>setTimeout(()=>tone(f,.4,'sine',.08),i*180))},
  };
})();

/* =========================================================
   ENGINE HIỆU ỨNG HẠT (canvas, tối ưu cho điện thoại)
   - sprite phát sáng dựng sẵn (không dùng shadowBlur)
   - chỉ chạy requestAnimationFrame khi có hạt
   - giới hạn số hạt, giảm số hạt trên màn hình nhỏ
========================================================= */
const FX=(()=>{
  const cv=$('#fx'),g=cv.getContext('2d');let W=0,H=0;const P=[];let raf=0,last=0;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let Q=1;const MAX=650;
  function resize(){const dpr=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*dpr|0;cv.height=H*dpr|0;g.setTransform(dpr,0,0,dpr,0,0);Q=(W*H<520000?.65:1)*(reduce?.4:1)}
  addEventListener('resize',resize);resize();
  const cache={};
  function sprite(c){if(cache[c])return cache[c];const s=64,cn=document.createElement('canvas');cn.width=cn.height=s;const x=cn.getContext('2d');const gr=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,c);gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,s,s);return cache[c]=cn}
  function add(p){if(P.length>=MAX)return null;p.t=0;P.push(p);if(!raf){last=performance.now();raf=requestAnimationFrame(loop)}return p}
  const ease=u=>1-(1-u)*(1-u);
  function loop(now){
    const dt=Math.min(.05,(now-last)/1000);last=now;g.clearRect(0,0,W,H);
    for(let i=P.length-1;i>=0;i--){const p=P[i];p.t+=dt;if(p.t>=p.life){P[i]=P[P.length-1];P.pop();continue}upd(p,dt);draw(p)}
    g.globalAlpha=1;g.globalCompositeOperation='source-over';
    if(P.length)raf=requestAnimationFrame(loop);else{raf=0;g.clearRect(0,0,W,H)}
  }
  function upd(p,dt){
    if(p.k==='proj'){
      const u=Math.min(1,p.t/p.life),e=p.ease?ease(u):u;
      const px=p.x,py=p.y;
      p.x=p.sx+(p.tx-p.sx)*e;p.y=p.sy+(p.ty-p.sy)*e+(p.arc||0)*Math.sin(Math.PI*e);
      p.ang=Math.atan2(p.y-py,p.x-px)||p.ang||0;
      if(p.trail&&Math.random()<(p.tr||.9)*Q*2){add({k:'dot',x:p.x+rnd(-4,4),y:p.y+rnd(-4,4),vx:rnd(-30,30),vy:rnd(-30,30)+(p.tg||0),life:rnd(.2,.45),s:p.s*rnd(.35,.7),c:pick(p.trail),add:1,shrink:1,drag:2})}
      return;
    }
    if(p.drag)p.vx*=1-Math.min(1,p.drag*dt),p.vy*=1-Math.min(1,p.drag*dt);
    if(p.g)p.vy+=p.g*dt;
    p.x+=(p.vx||0)*dt;p.y+=(p.vy||0)*dt;
    if(p.vr)p.rot=(p.rot||0)+p.vr*dt;
  }
  function draw(p){
    const u=p.t/p.life;let a=p.fadeIn&&u<p.fadeIn?u/p.fadeIn:(1-u);
    g.globalCompositeOperation=p.add?'lighter':'source-over';
    g.globalAlpha=Math.max(0,Math.min(1,a*(p.a0||1)));
    switch(p.k){
      case'dot':{const s=p.s*(p.shrink?1-u*.7:1)*(p.grow?1+u*p.grow:1);g.drawImage(sprite(p.c),p.x-s,p.y-s,s*2,s*2);break}
      case'spark':{const sp=Math.hypot(p.vx,p.vy)||1,l=p.l||10;g.strokeStyle=p.c;g.lineWidth=Math.max(.5,p.s*(1-u));g.lineCap='round';g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x-p.vx/sp*l,p.y-p.vy/sp*l);g.stroke();break}
      case'shard':{const s=p.s;g.save();g.translate(p.x,p.y);g.rotate(p.rot!=null?p.rot:Math.atan2(p.vy,p.vx));g.fillStyle=p.c;g.beginPath();g.moveTo(s,0);g.lineTo(-s*.6,s*.38);g.lineTo(-s*.35,0);g.lineTo(-s*.6,-s*.38);g.closePath();g.fill();g.restore();break}
      case'rock':{const s=p.s;g.save();g.translate(p.x,p.y);g.rotate(p.rot||0);g.fillStyle=p.c;g.beginPath();g.moveTo(s,0);g.lineTo(s*.3,s*.8);g.lineTo(-s*.7,s*.5);g.lineTo(-s*.8,-s*.4);g.lineTo(s*.2,-s*.9);g.closePath();g.fill();g.restore();break}
      case'ring':{const r=p.r0+(p.r1-p.r0)*ease(u);g.strokeStyle=p.c;g.lineWidth=Math.max(.5,p.s*(1-u));g.beginPath();if(p.sq){g.ellipse(p.x,p.y,r,r*p.sq,0,0,Math.PI*2)}else g.arc(p.x,p.y,Math.max(0,r),0,Math.PI*2);g.stroke();break}
      case'arc':{
        const k=Math.min(1,u*2.4),e=ease(k),st=p.a0+p.sw*Math.max(0,(u-.35)/.65)*.9,en=p.a0+p.sw*e;
        g.save();g.translate(p.x,p.y);g.rotate(p.rot||0);g.scale(1,p.sq||1);g.lineCap='round';
        g.globalAlpha=Math.max(0,1-Math.max(0,u-.4)/.6);
        g.strokeStyle=p.c2||p.c;g.lineWidth=p.w*2.4;g.globalAlpha*=.35;g.beginPath();g.arc(0,0,p.R,st,en);g.stroke();
        g.globalAlpha/=.35;g.strokeStyle=p.c;g.lineWidth=p.w;g.beginPath();g.arc(0,0,p.R,st,en);g.stroke();
        g.strokeStyle='#fff';g.lineWidth=p.w*.35;g.beginPath();g.arc(0,0,p.R,st,en);g.stroke();
        g.restore();break}
      case'bolt':{if(Math.random()<.25)break;g.lineJoin='round';g.lineCap='round';for(const [w,c,al] of [[p.s*3,p.c,.35],[p.s,'#fff',1]]){g.globalAlpha=Math.max(0,(1-u))*al;g.strokeStyle=c;g.lineWidth=w;g.beginPath();p.pts.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.stroke()}break}
      case'flash':{g.fillStyle=p.c;g.fillRect(0,0,W,H);break}
      case'txt':{g.font=`900 ${p.s}px system-ui,sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillStyle=p.c;g.fillText(p.txt,p.x,p.y);break}
      case'proj':{
        const s=p.s;
        if(p.shape==='shard'){g.save();g.translate(p.x,p.y);g.rotate(p.ang);g.fillStyle=p.c;g.beginPath();g.moveTo(s*1.4,0);g.lineTo(-s*.8,s*.45);g.lineTo(-s*.4,0);g.lineTo(-s*.8,-s*.45);g.closePath();g.fill();g.restore();g.globalCompositeOperation='lighter';g.drawImage(sprite(p.c),p.x-s,p.y-s,s*2,s*2)}
        else if(p.shape==='cres'){g.save();g.translate(p.x,p.y);g.rotate(p.ang);g.lineCap='round';g.strokeStyle=p.c;g.lineWidth=s*.35;g.beginPath();g.arc(-s*.6,0,s*1.6,-1.1,1.1);g.stroke();g.strokeStyle='#fff';g.lineWidth=s*.12;g.beginPath();g.arc(-s*.6,0,s*1.6,-1,1);g.stroke();g.restore()}
        else if(p.shape==='ring'){g.strokeStyle=p.c;g.lineWidth=4;g.beginPath();g.arc(p.x,p.y,s,0,Math.PI*2);g.stroke();g.drawImage(sprite(p.c),p.x-s*.8,p.y-s*.8,s*1.6,s*1.6)}
        else if(p.shape==='rock'){g.globalCompositeOperation='lighter';g.drawImage(sprite(p.c),p.x-s*1.8,p.y-s*1.8,s*3.6,s*3.6);g.globalCompositeOperation='source-over';g.fillStyle='#4a2a1a';g.beginPath();g.arc(p.x,p.y,s*.7,0,Math.PI*2);g.fill()}
        else g.drawImage(sprite(p.c),p.x-s,p.y-s,s*2,s*2);
        break}
    }
  }
  /* --- hàm tiện ích tạo hiệu ứng --- */
  const api={
    get Q(){return Q},
    burst(x,y,o){const n=Math.max(1,Math.round((o.n||12)*Q));for(let i=0;i<n;i++){const an=o.a!=null?o.a+rnd(-(o.spread||.6),o.spread||.6):rnd(0,Math.PI*2),sp=rnd((o.sp||200)*.35,o.sp||200);add({k:o.k||'dot',x:x+rnd(-(o.r||0),o.r||0),y:y+rnd(-(o.r||0),o.r||0),vx:Math.cos(an)*sp,vy:Math.sin(an)*sp+(o.vy||0),life:rnd((o.life||.5)*.6,o.life||.5),s:rnd((o.s||6)*.5,o.s||6),c:Array.isArray(o.c)?pick(o.c):o.c,g:o.g||0,drag:o.drag!=null?o.drag:2.5,add:o.add===false?0:1,l:o.l,shrink:o.shrink!==false,rot:o.k==='rock'||o.k==='shard'&&o.spin?rnd(0,6):undefined,vr:o.spin?rnd(-8,8):0,grow:o.grow,a0:o.a0})}},
    ring(x,y,c,r0,r1,life=.4,s=5,sq){add({k:'ring',x,y,c,r0,r1,life,s,add:1,sq})},
    slash(x,y,c,rot,R=70,o={}){const sw=o.sw||2.2,mid=o.a0!=null?o.a0+sw/2:-sw/2+sw/2;add({k:'arc',x:x-Math.cos(rot)*R*.0,y,R,a0:o.a0!=null?o.a0:-sw/2,sw,rot,c,c2:o.c2||c,w:o.w||7,sq:o.sq||.42,life:o.life||.32,add:1})},
    bolt(x1,y1,x2,y2,c,s=3,life=.3){let pts=[[x1,y1],[x2,y2]];let off=Math.hypot(x2-x1,y2-y1)*.18;for(let k=0;k<5;k++){const np=[];for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];np.push(a);np.push([(a[0]+b[0])/2+rnd(-off,off),(a[1]+b[1])/2+rnd(-off,off)*.4])}np.push(pts[pts.length-1]);pts=np;off/=2}add({k:'bolt',pts,c,s,life,add:1})},
    proj(a,b,o){const life=o.dur||.35;add({k:'proj',sx:a.x,sy:a.y,tx:b.x,ty:b.y,x:a.x,y:a.y,life,s:o.s||12,c:o.c,trail:o.trail,arc:o.arc,shape:o.shape,ease:o.ease,tr:o.tr,tg:o.tg,add:1});return life*1000},
    flash(c,a0=.4,life=.25){add({k:'flash',c,a0,life,x:0,y:0})},
    txt(x,y,txt,c,s=22,o={}){add({k:'txt',x,y,txt,c,s,vx:o.vx||rnd(-20,20),vy:o.vy!=null?o.vy:-80,g:o.g||0,life:o.life||.9,drag:o.drag||0,add:0,fadeIn:.15})},
    add,
    get count(){return P.length}
  };
  return api;
})();

/* =========================================================
   CÔNG THỨC HIỆU ỨNG CHO TỪNG THẺ / ĐÒN ĐÁNH
   Mỗi hàm trả về Promise kết thúc đúng lúc "trúng đòn"
========================================================= */
function shake(strong){const a=$('#arena');const c=strong?'shake2':'shake';a.classList.remove('shake','shake2');void a.offsetWidth;a.classList.add(c)}
const FXR={
  async slash(a,b,i=0){const rot=(i%2?2.5:.65)+rnd(-.15,.15);SFX.slash();FX.slash(b.x,b.y,'#dff4ff',rot,62,{c2:'#7fc8ff',w:6});await wait(110);FX.burst(b.x,b.y,{n:14,c:['#fff','#bfe6ff'],sp:420,life:.3,k:'spark',s:2.2,l:14});FX.burst(b.x,b.y,{n:6,c:'#9fd8ff',sp:80,life:.35,s:14})},
  async pierce(a,b){SFX.slash();const d=FX.proj({x:a.x+30,y:a.y},b,{c:'#ffffff',s:9,dur:.14,trail:['#ff9a8a','#fff'],tr:1});await wait(d);FX.ring(b.x,b.y,'#fff',4,70,.3,6);FX.burst(b.x,b.y,{n:16,c:['#ff4a3d','#ffb0a0'],a:0,spread:.5,sp:520,life:.35,k:'spark',s:2.5,l:18});FX.burst(b.x,b.y,{n:10,c:'#ff2a2a',sp:60,life:.6,s:16,g:-40});shake()},
  async whirl(a,bs){SFX.slash();for(let k=0;k<3;k++)FX.slash(a.x,a.y,'#ffe7a0',k*2.1,55,{sw:3.6,sq:.45,c2:'#ff9a3a',w:5,life:.4});FX.ring(a.x,a.y+30,'#ffd27a',20,110,.45,4,.35);await wait(200);for(const b of bs){FX.slash(b.x,b.y,'#fff',rnd(0,6),60,{c2:'#ffb347'});FX.burst(b.x,b.y,{n:12,c:['#fff','#ffd27a'],sp:380,life:.3,k:'spark',s:2,l:12})}SFX.slash();await wait(90)},
  async fire(a,b){SFX.fire();const d=FX.proj(a,b,{c:'#ff9a2e',s:20,dur:.38,trail:['#ff5a1f','#ffcc33','#ff2a00'],arc:-50,ease:0});await wait(d);SFX.big();FX.burst(b.x,b.y,{n:40,c:['#ff5a1f','#ffcc33','#ff2a00','#fff1a0'],sp:330,life:.6,s:14,g:-220});FX.ring(b.x,b.y,'#ffb347',10,95,.4,7);FX.burst(b.x,b.y,{n:10,c:'#3a2a26',sp:70,life:1.1,s:20,g:-70,add:false,a0:.55,grow:1.2});FX.flash('#ff7a20',.18,.2);shake()},
  async bigSlash(a,b){SFX.big();FX.flash('#fff6d8',.55,.3);FX.slash(b.x,b.y,'#fff4c0',.55,120,{w:14,c2:'#ffb020',sq:.38,life:.45});await wait(90);FX.slash(b.x,b.y,'#fff4c0',2.6,120,{w:12,c2:'#ff7a20',sq:.38,life:.45});await wait(80);FX.burst(b.x,b.y,{n:50,c:['#fff','#ffd24a','#ff9a2e'],sp:650,life:.5,k:'spark',s:3,l:22});FX.ring(b.x,b.y,'#ffd24a',10,150,.5,8);FX.burst(b.x,b.y,{n:14,c:'#ffcf6a',sp:120,life:.7,s:22});shake(true)},
  async wave(a,b){SFX.slash();const d=FX.proj(a,b,{c:'#7ff6ff',s:22,dur:.3,shape:'cres',trail:['#7ff6ff','#d8ffff'],tr:1});await wait(d);FX.slash(b.x,b.y,'#d8ffff',1.6,60,{c2:'#38e0ff',w:7});FX.burst(b.x,b.y,{n:18,c:['#7ff6ff','#fff'],sp:420,life:.35,k:'spark',s:2,l:14})},
  async blood(a){SFX.hit();FX.burst(a.x,a.y,{n:24,c:['#d0102a','#ff3a4a'],sp:240,life:.8,s:5,g:900,vy:-180,add:false,shrink:false});await wait(220);FX.burst(a.x,a.y+30,{n:20,c:['#ffd24a','#fff1a0'],a:-Math.PI/2,spread:.7,sp:260,life:.6,k:'spark',s:2.5,l:14});FX.ring(a.x,a.y,'#ff3a4a',60,10,.35,5);await wait(120)},
  async buff(a,col='#ff5a4a',col2='#ffd27a'){SFX.buff();FX.ring(a.x,a.y+45,col,10,80,.5,6,.3);for(let i=0;i<Math.round(26*FX.Q);i++)FX.add({k:'spark',x:a.x+rnd(-40,40),y:a.y+rnd(20,55),vx:0,vy:-rnd(140,300),life:rnd(.4,.8),s:rnd(2,3.5),l:rnd(10,22),c:Math.random()<.5?col:col2,add:1,drag:.5});FX.txt(a.x,a.y-30,'▲',col2,26,{vy:-110,vx:0});await wait(250)},
  buffRed(a){return FXR.buff(a,'#ff5a4a','#ffd27a')},
  buffBlue(a){return FXR.buff(a,'#4fb3ff','#c6f0ff')},
  buffGold(a){return FXR.buff(a,'#ffcc33','#fff7c0')},
  buffPurple(a){return FXR.buff(a,'#b45cff','#ffb0ff')},
  async shield(a){SFX.block();FX.ring(a.x,a.y,'#8fd6ff',95,48,.35,5);const n=Math.round(16*FX.Q);for(let i=0;i<n;i++){const an=i/n*Math.PI*2;FX.add({k:'dot',x:a.x+Math.cos(an)*50,y:a.y+Math.sin(an)*50,vx:Math.cos(an)*30,vy:Math.sin(an)*30,life:.5,s:7,c:'#7fd0ff',add:1,shrink:1})}await wait(180)},
  async iceShard(a,b,i=0){SFX.ice();let d=0;for(let k=0;k<3;k++){d=FX.proj({x:a.x+20,y:a.y-20+k*20},{x:b.x+rnd(-10,10),y:b.y+rnd(-14,14)},{c:'#bfeaff',s:9,dur:.22,shape:'shard',trail:['#9fe0ff','#ffffff'],tr:.8});await wait(55)}await wait(d-60);FX.burst(b.x,b.y,{n:18,c:['#d8f6ff','#8fd6ff','#fff'],sp:360,life:.55,k:'shard',s:7,g:700,drag:1,spin:1,add:true});FX.ring(b.x,b.y,'#bfeaff',6,55,.3,4);FX.txt(b.x+rnd(-20,20),b.y-20,'❄','#e8faff',20)},
  async frost(a,b){SFX.ice();const d=FX.proj(a,b,{c:'#8fd6ff',s:13,dur:.3,trail:['#bfeaff','#ffffff']});await wait(d);FX.burst(b.x,b.y,{n:14,c:['#9fdcff','#d8f4ff'],sp:70,life:1,s:26,drag:1.2,a0:.5,grow:.8});for(let k=0;k<5;k++)FX.txt(b.x+rnd(-40,40),b.y-50+rnd(-10,10),'❄','#e8faff',rnd(14,22),{vy:rnd(30,60),life:1.1});FX.ring(b.x,b.y,'#bfeaff',8,65,.4,4)},
  async blizzard(a,bs){SFX.ice();const W=innerWidth,top=Math.min(...bs.map(b=>b.y))-120;for(let i=0;i<Math.round(70*FX.Q);i++)FX.add({k:i%3?'dot':'shard',x:rnd(-80,W*.6),y:rnd(top,top+240),vx:rnd(500,800),vy:rnd(60,140),life:rnd(.6,1),s:rnd(3,7),c:pick(['#ffffff','#bfeaff','#8fd6ff']),add:1,shrink:1});await wait(380);for(const b of bs){FX.burst(b.x,b.y,{n:14,c:['#d8f6ff','#8fd6ff'],sp:300,life:.5,k:'shard',s:6,g:500,spin:1});FX.txt(b.x,b.y-30,'❄','#e8faff',20)}},
  async lightning(a,b){SFX.zap();const top=Math.max(0,b.y-260);FX.bolt(b.x+rnd(-40,40),top,b.x,b.y,'#fff27a',3.5,.35);await wait(40);FX.bolt(b.x+rnd(-40,40),top,b.x,b.y,'#9fd8ff',2,.3);FX.flash('#fffbe0',.35,.18);FX.burst(b.x,b.y,{n:24,c:['#fff27a','#fff'],sp:480,life:.35,k:'spark',s:2.5,l:16});FX.ring(b.x,b.y,'#fff27a',5,80,.3,5);shake()},
  async chain(a,b,i){SFX.zap();FX.bolt(a.x+20,a.y-10,b.x,b.y,i%2?'#9fd8ff':'#fff27a',2.5,.25);await wait(60);FX.burst(b.x,b.y,{n:12,c:['#fff27a','#fff'],sp:380,life:.3,k:'spark',s:2,l:12})},
  async iceArmor(a){SFX.ice();const n=Math.round(18*FX.Q);for(let i=0;i<n;i++){const an=i/n*Math.PI*2,r=120;FX.add({k:'shard',x:a.x+Math.cos(an)*r,y:a.y+Math.sin(an)*r,vx:-Math.cos(an)*r*2.6,vy:-Math.sin(an)*r*2.6,life:.38,s:8,c:pick(['#d8f6ff','#8fd6ff']),add:1})}await wait(330);SFX.block();FX.ring(a.x,a.y,'#d8f6ff',30,85,.4,5);FX.burst(a.x,a.y,{n:12,c:'#bfeaff',sp:120,life:.6,s:9})},
  async meteor(a,bs){for(const b of bs){const d=FX.proj({x:b.x+240,y:-60},b,{c:'#ff8a2a',s:20,dur:.45,shape:'rock',trail:['#ff5a1f','#ffcc33','#7a3a1a'],tr:1});setTimeout(()=>{SFX.big();FX.burst(b.x,b.y,{n:36,c:['#ff5a1f','#ffcc33','#fff1a0'],sp:420,life:.65,s:15,g:-150});FX.burst(b.x,b.y+30,{n:12,c:'#6a4a3a',sp:300,life:.8,k:'rock',s:7,g:900,vy:-250,add:false,spin:1});FX.ring(b.x,b.y,'#ffb347',10,120,.5,8)},d);await wait(110)}await wait(380);FX.flash('#ff8a2a',.3,.3);shake(true)},
  async curse(a,b){SFX.dark();FX.burst(b.x,b.y,{n:16,c:['#5a1a8a','#2a0a3a'],sp:80,life:1,s:22,g:-50,add:false,a0:.6,grow:1});FX.ring(b.x,b.y,'#b45cff',90,20,.5,4);await wait(150);FX.txt(b.x,b.y-30,'☠','#d38bff',30,{vy:-60,vx:0,life:1});FX.burst(b.x,b.y,{n:14,c:['#d38bff','#ff6ad5'],sp:160,life:.6,k:'spark',s:2,l:10})},
  async debuff(a,b){SFX.dark();FX.ring(b.x,b.y,'#b45cff',70,15,.4,3);for(let k=0;k<4;k++)FX.txt(b.x+rnd(-30,30),b.y-40,'▼','#c78bff',18,{vy:70,life:.7});FX.burst(b.x,b.y,{n:10,c:'#7a3aaa',sp:60,life:.8,s:16,add:false,a0:.5,g:-30});await wait(200)},
  async arcane(a){SFX.buff();const n=Math.round(14*FX.Q);for(let i=0;i<n;i++){const an=i/n*Math.PI*2;FX.add({k:'dot',x:a.x+Math.cos(an)*55,y:a.y+Math.sin(an)*55,vx:-Math.sin(an)*140,vy:Math.cos(an)*140-40,life:.7,s:6,c:pick(['#b45cff','#5ff5ff','#ffffff']),add:1,drag:1})}FX.ring(a.x,a.y,'#c78bff',10,70,.4,4);FX.txt(a.x,a.y-40,'✦','#e8d0ff',24,{vy:-70});await wait(220)},
  async drain(a,b){SFX.dark();FX.slash(b.x,b.y,'#ff5a7a',2.2,55,{c2:'#8a0a3a'});await wait(120);FX.burst(b.x,b.y,{n:10,c:'#ff3a5a',sp:200,life:.35,k:'spark',s:2,l:10});for(let k=0;k<Math.round(10*FX.Q);k++){FX.proj({x:b.x+rnd(-15,15),y:b.y+rnd(-15,15)},a,{c:k%2?'#ff3a5a':'#6dff9a',s:6,dur:rnd(.35,.55),arc:rnd(-60,60),trail:['#ff6a8a'],tr:.4});}await wait(380)},
  async punch(a,b,i=0){SFX.hit();const ox=(i%2?-14:14),oy=rnd(-12,12);FX.ring(b.x+ox,b.y+oy,'#ffffff',6,58,.25,6);FX.burst(b.x+ox,b.y+oy,{n:16,c:['#fff','#ffe17a'],sp:420,life:.28,k:'spark',s:3,l:12});FX.burst(b.x+ox,b.y+oy,{n:4,c:'#ffd27a',sp:60,life:.25,s:22});shake()},
  async palm(a,b){SFX.slash();const d=FX.proj(a,b,{c:'#b8ffcf',s:24,dur:.28,shape:'ring',trail:['#8affb0','#ffffff'],tr:.8});await wait(d);SFX.hit();FX.ring(b.x,b.y,'#d8ffe6',10,110,.45,7);FX.burst(b.x,b.y,{n:18,c:['#fff','#8affb0'],a:0,spread:.9,sp:500,life:.35,k:'spark',s:2,l:20});shake()},
  async stoneWall(a){SFX.big();const x=a.x+45,y=a.y+50;FX.burst(x,y,{n:20,c:['#9a6a40','#c08a55','#6a4a2a'],a:-Math.PI/2,spread:.8,sp:620,life:.8,k:'rock',s:8,g:1500,add:false,spin:1,drag:.3,shrink:false});FX.burst(x,y,{n:10,c:'#a08a6a',sp:120,life:.9,s:20,add:false,a0:.45,g:-30,grow:1});FX.ring(x,y,'#c08a55',10,90,.4,6,.35);await wait(260);SFX.block();FX.ring(a.x,a.y,'#ffd9a0',90,45,.3,5);shake()},
  async thorns(a){SFX.buff();FX.burst(a.x,a.y,{n:24,c:['#5fe06a','#c8ff7a'],sp:340,life:.4,k:'spark',s:3,l:24,drag:3});FX.ring(a.x,a.y,'#5fe06a',20,90,.4,4);await wait(200)},
  async heal(a){SFX.heal();for(let k=0;k<7;k++)FX.txt(a.x+rnd(-40,40),a.y+rnd(-10,40),'✚','#6dff9a',rnd(16,26),{vy:-rnd(60,110),life:1});FX.burst(a.x,a.y+20,{n:16,c:['#6dff9a','#d8ffe6'],a:-Math.PI/2,spread:.9,sp:120,life:.9,s:8});FX.ring(a.x,a.y+45,'#6dff9a',10,70,.5,4,.3);await wait(250)},
  async shockwave(a,b){SFX.big();const d=FX.proj(a,b,{c:'#9fd8ff',s:26,dur:.3,shape:'ring',trail:['#cfeaff','#7fc8ff'],tr:1});await wait(d);FX.ring(b.x,b.y,'#cfeaff',10,130,.5,9);FX.burst(b.x,b.y,{n:30,c:['#fff','#9fd8ff'],sp:540,life:.4,k:'spark',s:3,l:18});shake(true)},
  async quake(a,bs){SFX.big();shake(true);for(const b of bs){FX.burst(b.x,b.y+50,{n:14,c:['#9a6a40','#c08a55'],a:-Math.PI/2,spread:.7,sp:560,life:.7,k:'rock',s:7,g:1400,add:false,spin:1,shrink:false});FX.burst(b.x,b.y+50,{n:8,c:'#a08a6a',sp:140,life:.8,s:22,add:false,a0:.4,grow:1});FX.ring(b.x,b.y+50,'#ffcf8a',10,80,.4,5,.3)}await wait(260)},
  async smash(a,b){SFX.big();FX.ring(b.x,b.y,'#fff',8,90,.35,8);FX.burst(b.x,b.y,{n:26,c:['#fff','#ffcf8a'],sp:480,life:.35,k:'spark',s:3,l:16});FX.burst(b.x,b.y+30,{n:8,c:'#8a7a6a',sp:120,life:.7,s:18,add:false,a0:.4});shake(true)},
  async claw(a,b){SFX.slash();for(let k=-1;k<=1;k++)FX.slash(b.x+k*16,b.y+k*4,'#ff8a7a',2.1,58,{c2:'#c0102a',w:4,sq:.25,life:.28});await wait(110);FX.burst(b.x,b.y,{n:12,c:['#ff3a4a','#ffb0a0'],sp:320,life:.35,k:'spark',s:2,l:10})},
  async bite(a,b){SFX.hit();FX.slash(b.x,b.y-22,'#ffffff',0,50,{a0:.3,sw:2.5,c2:'#ff4a5a',w:6,sq:.5,life:.25});FX.slash(b.x,b.y+22,'#ffffff',Math.PI,50,{a0:.3,sw:2.5,c2:'#ff4a5a',w:6,sq:.5,life:.25});await wait(120);FX.burst(b.x,b.y,{n:14,c:['#ff2a3a','#ff8a8a'],sp:280,life:.4,s:5,g:500,add:false});shake()},
  async spit(a,b){SFX.poison();const d=FX.proj(a,b,{c:'#9dff3d',s:12,dur:.34,arc:-60,trail:['#6add2a','#d0ff8a']});await wait(d);FX.burst(b.x,b.y,{n:18,c:['#9dff3d','#5ac02a','#d0ff8a'],sp:180,life:.7,s:8,g:-60})},
  async darkBolt(a,b){SFX.dark();const d=FX.proj(a,b,{c:'#b45cff',s:16,dur:.36,trail:['#6a1aaa','#d38bff','#2a0a3a'],tr:1});await wait(d);FX.ring(b.x,b.y,'#d38bff',8,85,.4,6);FX.burst(b.x,b.y,{n:22,c:['#b45cff','#ff6ad5','#fff'],sp:360,life:.45,k:'spark',s:2.5,l:14});FX.burst(b.x,b.y,{n:8,c:'#3a0a5a',sp:80,life:.8,s:20,add:false,a0:.5});shake()},
  fireball(a,b){return FXR.fire(a,b)},
  async frostBreath(a,b){SFX.ice();const n=Math.round(46*FX.Q);for(let i=0;i<n;i++){const t=i/n;setTimeout(()=>FX.add({k:i%3?'dot':'shard',x:a.x-20,y:a.y+rnd(-10,10),vx:(b.x-a.x)*rnd(1.8,2.6),vy:(b.y-a.y)*2+rnd(-90,90),life:.5,s:rnd(5,10),c:pick(['#ffffff','#bfeaff','#8fd6ff']),add:1,shrink:1}),t*300)}await wait(420);FX.burst(b.x,b.y,{n:18,c:['#d8f6ff','#8fd6ff'],sp:300,life:.5,k:'shard',s:7,g:500,spin:1});shake()},
  async zap(a,b){SFX.zap();FX.bolt(a.x,a.y,b.x,b.y,'#fff27a',3,.3);await wait(60);FX.flash('#fffbe0',.25,.15);FX.burst(b.x,b.y,{n:16,c:['#fff27a','#fff'],sp:420,life:.3,k:'spark',s:2.5,l:14})},
  async poisonFx(a,b){SFX.poison();FX.burst(b.x,b.y,{n:14,c:['#9dff3d','#5ac02a'],sp:90,life:.9,s:9,g:-70});FX.txt(b.x,b.y-30,'☠','#b6ff4a',22,{vy:-60,vx:0})},
  async burnFx(a,b){SFX.fire();FX.burst(b.x,b.y+20,{n:18,c:['#ff5a1f','#ffcc33'],a:-Math.PI/2,spread:.6,sp:200,life:.7,s:9,g:-120})},
  async summonFx(a,b){FX.burst(b.x,b.y,{n:16,c:['#ffffff','#d38bff'],sp:200,life:.5,s:8})},
};

