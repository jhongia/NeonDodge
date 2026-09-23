'use strict';
(() => {
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const ui = Object.fromEntries(['score','best','pause','sound','overlay','play','status','level','overlay-title','overlay-copy','overlay-kicker','overlay-hint'].map(id => [id, document.getElementById(id)]));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const keys = new Set();
  const ship = { x: 500, y: 490, radius: 11 };
  let width = 1000, height = 580, state = 'ready', elapsed = 0, spawnClock = 0, lastTime = 0;
  let obstacles = [], particles = [], pointer = null, best = 0, sound = false, audio, crashTime = 0;
  try { const saved = Number(localStorage.getItem('neon-dodge-best')); best = Number.isFinite(saved) ? Math.max(0, saved) : 0; } catch { /* Session-only scores when storage is unavailable. */ }
  const format = value => String(Math.floor(value)).padStart(5, '0');
  ui.best.textContent = format(best);
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const oldWidth = width, oldHeight = height;
    width = 1000; height = width * rect.height / rect.width;
    ship.x *= width / oldWidth; ship.y *= height / oldHeight;
    obstacles.forEach(o => { o.x *= width / oldWidth; o.y *= height / oldHeight; });
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * scale); canvas.height = Math.round(rect.height * scale);
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
  }
  new ResizeObserver(resize).observe(canvas);
  function tone(frequency, duration, type = 'sine') {
    if (!sound) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      audio.resume().catch(() => {});
      const oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
      gain.gain.setValueAtTime(.055, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration);
    } catch { /* Audio is optional. */ }
  }
  function updateScore() {
    ui.score.textContent = format(elapsed * 10);
    ui.level.textContent = `THREAT: ${elapsed < 20 ? 'LOW' : elapsed < 50 ? 'RISING' : 'HIGH'}`;
  }
  function start() {
    elapsed = 0; spawnClock = 0; obstacles = []; particles = []; keys.clear(); pointer = null;
    ship.x = width / 2; ship.y = height * .82; crashTime = 0;
    state = 'playing'; ui.overlay.hidden = true; ui.pause.disabled = false; ui.pause.textContent = 'PAUSE Ⅱ';
    ui.status.textContent = 'FLIGHT ACTIVE'; updateScore(); tone(520, .15); ui.pause.focus({preventScroll:true});
  }
  function pause() {
    if (state !== 'playing') return;
    state = 'paused'; keys.clear(); pointer = null; ui.overlay.hidden = false;
    ui['overlay-kicker'].textContent = 'TAKE A BREATHER.'; ui['overlay-title'].textContent = 'Holding position.';
    ui['overlay-copy'].textContent = 'Your run is right where you left it.';
    ui['overlay-hint'].textContent = 'PRESS P OR ESC TO RESUME'; ui.play.textContent = 'RESUME FLIGHT ↗';
    ui.pause.textContent = 'RESUME ▷'; ui.status.textContent = 'FLIGHT PAUSED'; ui.play.focus({preventScroll:true});
  }
  function resume() {
    if (state !== 'paused') return;
    state = 'playing'; ui.overlay.hidden = true; ui.pause.textContent = 'PAUSE Ⅱ'; ui.status.textContent = 'FLIGHT ACTIVE';
    keys.clear(); pointer = null; ui.pause.focus({preventScroll:true});
  }
  function end() {
    state = 'over'; const score = Math.floor(elapsed * 10), record = score > best;
    best = Math.max(best, score); ui.best.textContent = format(best);
    try { localStorage.setItem('neon-dodge-best', String(best)); } catch { /* Keep the best score in memory. */ }
    if (!reducedMotion.matches) {
      crashTime = .18;
      for (let i = 0; i < 22; i++) { const angle = Math.random() * Math.PI * 2, speed = 70 + Math.random() * 220; particles.push({x:ship.x,y:ship.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:.7}); }
    }
    tone(95, .3, 'sawtooth'); keys.clear(); pointer = null; ui.overlay.hidden = false; ui.pause.disabled = true;
    ui['overlay-kicker'].textContent = record ? 'A NEW PERSONAL BEST.' : 'SIGNAL LOST.';
    ui['overlay-title'].textContent = 'One more flight?';
    ui['overlay-copy'].textContent = `${score} points · ${elapsed.toFixed(1)} seconds survived. Your next best is out there.`;
    ui['overlay-hint'].textContent = 'EVERY RUN IS A FRESH START'; ui.play.textContent = 'PLAY AGAIN ↗';
    ui.status.textContent = `RUN COMPLETE — ${score} POINTS`; ui.play.focus({preventScroll:true});
  }
  function spawn() {
    const size = 22 + Math.random() * 30;
    obstacles.push({x:size + Math.random() * (width-size*2),y:-size,size,speed:125+Math.min(elapsed*3,210)+Math.random()*75,angle:Math.random()*Math.PI,spin:(Math.random()-.5)*1.5});
  }
  function update(dt) {
    if (state === 'playing') {
      elapsed += dt; spawnClock += dt;
      const interval = Math.max(.22, .8 - elapsed * .008);
      while (spawnClock >= interval) { spawnClock -= interval; spawn(); }
      let dx = (keys.has('arrowright') || keys.has('d') ? 1 : 0) - (keys.has('arrowleft') || keys.has('a') ? 1 : 0);
      let dy = (keys.has('arrowdown') || keys.has('s') ? 1 : 0) - (keys.has('arrowup') || keys.has('w') ? 1 : 0);
      if (pointer) { dx = pointer.x - ship.x; dy = pointer.y - ship.y; }
      const length = Math.hypot(dx,dy), travel = pointer ? Math.min(length, 460*dt) : 400*dt;
      if (length) { ship.x += dx/length*travel; ship.y += dy/length*travel; }
      ship.x = Math.max(20,Math.min(width-20,ship.x)); ship.y = Math.max(44,Math.min(height-20,ship.y));
      for (const o of obstacles) {
        o.y += o.speed*dt; o.angle += o.spin*dt;
        // Transform the ship into the rotating square's coordinates for a tight collision boundary.
        const x = ship.x-o.x, y = ship.y-o.y, c = Math.cos(o.angle), s = Math.sin(o.angle);
        const localX = x*c+y*s, localY = -x*s+y*c;
        const nearX = Math.max(-o.size/2,Math.min(o.size/2,localX)), nearY = Math.max(-o.size/2,Math.min(o.size/2,localY));
        if (Math.hypot(localX-nearX,localY-nearY) < ship.radius) { end(); break; }
      }
      obstacles = obstacles.filter(o => o.y < height+70); updateScore();
    }
    if (state !== 'paused') {
      crashTime = Math.max(0,crashTime-dt);
      particles.forEach(p => { p.x += p.vx*dt; p.y += p.vy*dt; p.life -= dt; });
      particles = particles.filter(p => p.life > 0);
    }
  }
  function draw() {
    ctx.clearRect(0,0,width,height);
    ctx.strokeStyle = '#172333'; ctx.lineWidth = 1;
    for(let x=0;x<width;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}
    for(let y=0;y<height;y+=80){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
    for(let i=0;i<55;i++){ctx.fillStyle=i%3?'#6688a24d':'#a9ffcf80';ctx.fillRect((i*173+31)%width,(i*97+19)%height,2,2);}
    for(const o of obstacles){ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.angle);ctx.shadowColor='#ff638e';ctx.shadowBlur=reducedMotion.matches?0:12;ctx.fillStyle='#381c32';ctx.strokeStyle='#ff638e';ctx.lineWidth=2;ctx.fillRect(-o.size/2,-o.size/2,o.size,o.size);ctx.strokeRect(-o.size/2,-o.size/2,o.size,o.size);ctx.restore();}
    if(state!=='over') {ctx.save();ctx.translate(ship.x,ship.y);ctx.shadowColor='#a9ffcf';ctx.shadowBlur=reducedMotion.matches?0:22;ctx.fillStyle='#a9ffcf';ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(13,13);ctx.lineTo(0,7);ctx.lineTo(-13,13);ctx.closePath();ctx.fill();ctx.fillStyle='#f2fff8';ctx.fillRect(-2,-4,4,9);ctx.restore();}
    particles.forEach(p=>{ctx.globalAlpha=p.life/.7;ctx.fillStyle='#a9ffcf';ctx.fillRect(p.x,p.y,3,3);});ctx.globalAlpha=1;
    if(crashTime>0){ctx.fillStyle=`rgba(255,99,142,${crashTime*.8})`;ctx.fillRect(0,0,width,height);}
  }
  function frame(time) {
    let dt = Math.min((time-lastTime)/1000,.1); lastTime = time;
    // Small physics steps prevent fast debris from skipping collisions on slower screens.
    while(dt>0){const step=Math.min(dt,1/120);update(step);dt-=step;}
    draw(); requestAnimationFrame(frame);
  }
  ui.play.addEventListener('click',()=>state==='paused'?resume():start());
  ui.pause.addEventListener('click',()=>state==='playing'?pause():resume());
  ui.sound.addEventListener('click',()=>{sound=!sound;ui.sound.textContent=sound?'SOUND ON':'SOUND OFF';ui.sound.setAttribute('aria-pressed',String(sound));ui.sound.setAttribute('aria-label',sound?'Disable sound':'Enable sound');tone(660,.1);});
  window.addEventListener('keydown',event=>{
    const key=event.key.toLowerCase();
    if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(key)){if(state==='playing'){event.preventDefault();keys.add(key);}}
    if((key==='p'||key==='escape')&&!event.repeat){event.preventDefault();state==='playing'?pause():resume();}
  });
  window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
  function target(event){const rect=canvas.getBoundingClientRect();pointer={x:(event.clientX-rect.left)/rect.width*width,y:(event.clientY-rect.top)/rect.height*height};}
  canvas.addEventListener('pointerdown',event=>{if(state!=='playing')return;canvas.setPointerCapture(event.pointerId);target(event);});
  canvas.addEventListener('pointermove',event=>{if(canvas.hasPointerCapture(event.pointerId)&&state==='playing')target(event);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>pointer=null);
  window.addEventListener('blur',pause);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  resize(); requestAnimationFrame(frame);
})();
