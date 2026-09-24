const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const code=fs.readFileSync('game.js','utf8').replace('resize(); requestAnimationFrame(frame);','globalThis.test={start,pause,resume,end,update,draw,ship,keys,get state(){return state},get elapsed(){return elapsed},get obstacles(){return obstacles},get particles(){return particles},get best(){return best}}; resize(); requestAnimationFrame(frame);');
function setup(blocked=false,mobile=false,reduced=false){
 const nodes={};const context=new Proxy({},{get:()=>()=>{}});
 const element=id=>nodes[id]||=( {textContent:'',hidden:false,disabled:false,events:{},addEventListener(n,f){this.events[n]=f},setAttribute(){},focus(){},getContext:()=>context,getBoundingClientRect:()=>({width:mobile?360:1000,height:mobile?480:580,left:0,top:0}),setPointerCapture(){this.capture=true},hasPointerCapture(){return this.capture}});
 const document={querySelector:s=>element(s.slice(1)),getElementById:element,events:{},addEventListener(n,f){this.events[n]=f}};
 const window={events:{},addEventListener(n,f){this.events[n]=f},devicePixelRatio:1};
 const stored={};const sandbox={document,window,matchMedia:()=>({matches:reduced}),ResizeObserver:class{observe(){}},requestAnimationFrame(){},localStorage:{getItem(){if(blocked)throw Error();return 0},setItem(k,v){if(blocked)throw Error();stored[k]=v}},Math};
 vm.createContext(sandbox);vm.runInContext(code,sandbox);return {t:sandbox.test,nodes,window,document,stored};
}
let a=setup();a.t.start();assert.equal(a.t.state,'playing');a.t.update(.5);assert.equal(a.nodes.score.textContent,'00005');
a.t.pause();a.t.update(1);assert.equal(a.t.elapsed,.5);a.t.resume();assert.equal(a.t.state,'playing');
a.window.events.blur();assert.equal(a.t.state,'paused');a.t.resume();a.document.hidden=true;a.document.events.visibilitychange();assert.equal(a.t.state,'paused');
a.t.start();a.t.keys.add('d');a.t.update(.1);assert.equal(a.t.ship.x,540);
a.t.keys.clear();a.t.update(1);a.t.obstacles.length=0;a.t.obstacles.push({x:a.t.ship.x,y:a.t.ship.y,size:30,speed:0,angle:0,spin:0});a.t.update(.001);assert.equal(a.t.state,'over');assert.ok(a.t.best>=10);assert.ok(a.stored['neon-dodge-best']);
a.t.start();assert.equal(a.t.elapsed,0);assert.equal(a.t.obstacles.length,0);assert.equal(a.t.particles.length,0);assert.equal(a.nodes.score.textContent,'00000');
for(const rate of [30,60,120]){const b=setup();b.t.start();b.t.keys.add('d');for(let i=0;i<rate;i++)b.t.update(1/rate);assert.ok(Math.abs(b.t.ship.x-900)<.001)}
const m=setup(false,true);m.t.start();m.nodes.game.events.pointerdown({pointerId:1,clientX:300,clientY:200});m.t.update(.1);assert.ok(m.t.ship.x>500);assert.ok(m.t.ship.y<1333*.82);m.nodes.game.events.pointercancel();const x=m.t.ship.x;m.t.update(.1);assert.equal(m.t.ship.x,x);
const b=setup(true,false,true);b.t.start();b.t.update(.6);b.t.end();assert.equal(b.t.best,6);assert.equal(b.t.particles.length,0);b.t.draw();
for(const asset of ['style.css','game.js']){assert.ok(fs.readFileSync('index.html','utf8').includes(`./${asset}`));assert.ok(fs.existsSync(''+asset))}
console.log('PASS: launch, scoring, pause/resume, blur, visibility, movement, collision, best-score persistence, restart reset, 30/60/120Hz movement, portrait pointer movement/cancel, blocked storage, reduced motion, render API smoke check, relative asset paths.');
