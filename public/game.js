// ===== FULL FIX game.js =====

// Socket
const socket = io();

// Canvas
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// UI
const joinBtn = document.getElementById("joinBtn");
const coinEl = document.getElementById("coin");
const scoreEl = document.getElementById("score");
const onlineEl = document.getElementById("online");
const boardEl = document.getElementById("board");

// ==========================
// WORLD DATA
// ==========================
const plats = [
{x:0,y:620,w:2600,h:100},
{x:280,y:520,w:180,h:28},
{x:580,y:460,w:180,h:28},
{x:900,y:410,w:180,h:28},
{x:1220,y:500,w:200,h:28},
{x:1540,y:430,w:200,h:28},
{x:1880,y:360,w:220,h:28},
{x:2240,y:470,w:180,h:28},

{x:2800,y:620,w:2200,h:100},
{x:3000,y:520,w:180,h:28},
{x:3280,y:430,w:200,h:28},
{x:3600,y:350,w:200,h:28},
{x:3920,y:460,w:200,h:28},
{x:4250,y:390,w:180,h:28},
{x:4580,y:300,w:220,h:28},

{x:5200,y:620,w:2200,h:100},
{x:5450,y:500,w:220,h:28},
{x:5750,y:430,w:180,h:28},
{x:6060,y:350,w:180,h:28},
{x:6360,y:470,w:200,h:28},
{x:6700,y:390,w:200,h:28},
{x:7050,y:320,w:220,h:28}
];

const spikes = [
{x:760,y:600,w:120,h:20},
{x:1450,y:600,w:120,h:20},
{x:3400,y:600,w:140,h:20},
{x:4120,y:600,w:140,h:20},
{x:5600,y:600,w:140,h:20},
{x:6900,y:600,w:140,h:20}
];

const coins = [
{x:330,y:470,t:1},{x:380,y:470,t:1},{x:430,y:470,t:1},
{x:630,y:410,t:1},{x:680,y:410,t:1},{x:730,y:410,t:1},
{x:950,y:360,t:1},{x:1000,y:360,t:1},
{x:1280,y:450,t:1},{x:1330,y:450,t:1},
{x:1600,y:380,t:1},{x:1650,y:380,t:1},
{x:1940,y:310,t:1},{x:1990,y:310,t:1},
{x:2280,y:420,t:1},

{x:3040,y:470,t:1},{x:3090,y:470,t:1},
{x:3340,y:380,t:1},{x:3390,y:380,t:1},
{x:3660,y:300,t:1},{x:3710,y:300,t:1},
{x:3980,y:410,t:1},{x:4030,y:410,t:1},
{x:4300,y:340,t:1},{x:4350,y:340,t:1},
{x:4640,y:250,t:1},{x:4690,y:250,t:1},

{x:5500,y:450,t:1},{x:5550,y:450,t:1},
{x:5800,y:380,t:1},{x:5850,y:380,t:1},
{x:6110,y:300,t:1},{x:6160,y:300,t:1},
{x:6410,y:420,t:1},{x:6460,y:420,t:1},
{x:6750,y:340,t:1},{x:6800,y:340,t:1},
{x:7100,y:270,t:1},{x:7150,y:270,t:1}
];

const enemies = [
{x:520,y:586,w:34,h:34,v:2},
{x:1120,y:586,w:34,h:34,v:-2},
{x:3180,y:586,w:34,h:34,v:2},
{x:4380,y:586,w:34,h:34,v:-2},
{x:5480,y:586,w:34,h:34,v:2},
{x:6820,y:586,w:34,h:34,v:-2}
];

// ==========================
// PLAYER
// ==========================
let me = {
x:120,
y:500,
w:40,
h:52,
vx:0,
vy:0,
jump:false,
coins:0,
score:0,
name:"YOU",
skin:"classic"
};

let players = {};
let cameraX = 0;
let joined = false;

// ==========================
// INPUT
// ==========================
const keys = {};

addEventListener("keydown",e=>keys[e.code]=true);
addEventListener("keyup",e=>keys[e.code]=false);

document.getElementById("left").onpointerdown=()=>keys["ArrowLeft"]=true;
document.getElementById("left").onpointerup=()=>keys["ArrowLeft"]=false;

document.getElementById("right").onpointerdown=()=>keys["ArrowRight"]=true;
document.getElementById("right").onpointerup=()=>keys["ArrowRight"]=false;

document.getElementById("jump").onpointerdown=()=>keys["Space"]=true;
document.getElementById("jump").onpointerup=()=>keys["Space"]=false;

// ==========================
// JOIN GAME
// ==========================
joinBtn.onclick = ()=>{
me.name = document.getElementById("name").value || "Player";
me.skin = document.getElementById("skin").value;
joined = true;
socket.emit("join",me);
};

// ==========================
// SOCKET
// ==========================
socket.on("state",data=>{
players = data.players || {};
onlineEl.innerText = "Online: " + Object.keys(players).length;
updateBoard();
});

function updateBoard(){
let arr = Object.values(players);
arr.sort((a,b)=>b.score-a.score);

boardEl.innerHTML = arr.map(p=>
`<div>${p.name} - ${p.score}</div>`
).join("");
}

// ==========================
// HELPERS
// ==========================
function hit(a,b){
return a.x < b.x+b.w &&
a.x+a.w > b.x &&
a.y < b.y+b.h &&
a.y+a.h > b.y;
}

// ==========================
// UPDATE
// ==========================
function update(){

if(!joined) return;

// movement
me.vx = 0;

if(keys["ArrowLeft"] || keys["KeyA"]) me.vx = -5;
if(keys["ArrowRight"] || keys["KeyD"]) me.vx = 5;

if((keys["Space"]||keys["ArrowUp"]||keys["KeyW"]) && me.jump==false){
me.vy = -13;
me.jump = true;
}

// gravity
me.vy += 0.6;
if(me.vy > 14) me.vy = 14;

// X move
me.x += me.vx;

// Y move
me.y += me.vy;

// platform collision
for(let p of plats){
if(hit(me,p)){
if(me.vy > 0 && me.y+me.h < p.y+30){
me.y = p.y - me.h;
me.vy = 0;
me.jump = false;
}
}
}

// spikes
for(let s of spikes){
if(hit(me,s)){
respawn();
}
}

// enemies
for(let e of enemies){
e.x += e.v;
if(e.x < 0 || e.x > 7300) e.v *= -1;

if(hit(me,e)){
respawn();
}
}

// coins
for(let c of coins){
if(c.t && hit(me,{x:c.x,y:c.y,w:26,h:26})){
c.t = 0;
me.coins++;
me.score += 10;
}
}

// fall
if(me.y > 900) respawn();

// camera
cameraX = me.x - 300;
if(cameraX < 0) cameraX = 0;

// UI
coinEl.innerText = me.coins;
scoreEl.innerText = me.score;

// send
socket.emit("move",me);

}

function respawn(){
me.x = 120;
me.y = 500;
me.vx = 0;
me.vy = 0;
}

// ==========================
// DRAW
// ==========================
function draw(){

ctx.clearRect(0,0,canvas.width,canvas.height);

// sky
let g = ctx.createLinearGradient(0,0,0,720);
g.addColorStop(0,"#55b9ff");
g.addColorStop(1,"#0b74ff");
ctx.fillStyle = g;
ctx.fillRect(0,0,1400,720);

// clouds
ctx.fillStyle="rgba(255,255,255,.6)";
ctx.fillRect(120-cameraX*0.2,120,120,40);
ctx.fillRect(700-cameraX*0.2,160,160,45);

// platforms
for(let p of plats){
ctx.fillStyle="#8b5a2b";
ctx.fillRect(p.x-cameraX,p.y,p.w,p.h);

ctx.fillStyle="#2dbd46";
ctx.fillRect(p.x-cameraX,p.y,p.w,16);
}

// spikes
for(let s of spikes){
ctx.fillStyle="#ddd";
ctx.fillRect(s.x-cameraX,s.y,s.w,s.h);
}

// coins
for(let c of coins){
if(!c.t) continue;
ctx.beginPath();
ctx.arc(c.x-cameraX+12,c.y+12,12,0,Math.PI*2);
ctx.fillStyle="gold";
ctx.fill();
}

// enemies
for(let e of enemies){
ctx.fillStyle="#6b3f15";
ctx.fillRect(e.x-cameraX,e.y,e.w,e.h);
}

// self
drawPlayer(me,true);

// others
for(let id in players){
let p = players[id];
if(p.name===me.name) continue;
drawPlayer(p,false);
}

}

// ==========================
// PLAYER DRAW
// ==========================
function drawPlayer(p,isYou){

let x = p.x-cameraX;
let y = p.y;

// body
ctx.fillStyle = "#1d4ed8";
ctx.fillRect(x+8,y+22,24,30);

// head
ctx.fillStyle="#ffd7a8";
ctx.fillRect(x+10,y,20,20);

// hat
ctx.fillStyle =
p.skin==="gold" ? "#ffd700" :
p.skin==="ninja" ? "#111" :
p.skin==="frog" ? "#16a34a" :
"#ef4444";

ctx.fillRect(x+6,y-6,28,10);

// legs
ctx.fillStyle="#0f3ea3";
ctx.fillRect(x+10,y+52,8,12);
ctx.fillRect(x+22,y+52,8,12);

// name
ctx.fillStyle="white";
ctx.font="bold 16px Arial";
ctx.fillText(isYou?"YOU":p.name,x-4,y-12);
}

// ==========================
// LOOP
// ==========================
function loop(){
update();
draw();
requestAnimationFrame(loop);
}

loop();
