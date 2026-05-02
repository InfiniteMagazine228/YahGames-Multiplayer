FILE 5/8 — public/game.js

const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

let myId = null;
let players = {};
let leaderboard = [];

const keys = {};
const gravity = 0.6;

/* ===== PLAYER ===== */
let me = {
  x: 120,
  y: 500,
  w: 34,
  h: 46,
  vx: 0,
  vy: 0,
  ground: false,
  score: 0,
  coins: 0,
  skin: "classic",
  name: "Player"
};

/* ===== MAP ===== */
const plats = [
  {x:0,y:620,w:2200,h:100},
  {x:280,y:520,w:180,h:28},
  {x:580,y:460,w:180,h:28},
  {x:900,y:410,w:180,h:28},
  {x:1220,y:500,w:200,h:28},
  {x:1540,y:430,w:200,h:28}
];

const spikes = [
  {x:760,y:600,w:120,h:20},
  {x:1450,y:600,w:120,h:20}
];

const coins = [
  {x:330,y:470,t:1},
  {x:380,y:470,t:1},
  {x:630,y:410,t:1},
  {x:680,y:410,t:1},
  {x:950,y:360,t:1},
  {x:1000,y:360,t:1},
  {x:1280,y:450,t:1}
];

const enemies = [
  {x:520,y:586,w:34,h:34,v:2},
  {x:1120,y:586,w:34,h:34,v:-2}
];

/* ===== SOCKET ===== */
socket.on("you",(id)=>{
  myId = id;
});

socket.on("state",(data)=>{
  players = data.players || {};
  leaderboard = data.leaderboard || [];

  document.getElementById("online").innerText =
    "Online: " + Object.keys(players).length;

  drawBoard();
});

function drawBoard(){
  let html = "";
  leaderboard.forEach((p,i)=>{
    html += `${i+1}. ${p.name} (${p.score})<br>`;
  });
  document.getElementById("board").innerHTML = html;
}

/* ===== JOIN ===== */
document.getElementById("joinBtn").onclick = ()=>{
  me.name = document.getElementById("name").value || "Player";
  me.skin = document.getElementById("skin").value;

  socket.emit("join",{
    name: me.name,
    skin: me.skin
  });
};

/* ===== INPUT ===== */
window.onkeydown = e => keys[e.key] = true;
window.onkeyup = e => keys[e.key] = false;

function hold(id,key){
  const b = document.getElementById(id);
  b.onpointerdown = ()=>keys[key]=true;
  b.onpointerup = ()=>keys[key]=false;
  b.onpointerleave = ()=>keys[key]=false;
}
hold("left","ArrowLeft");
hold("right","ArrowRight");
hold("jump","ArrowUp");

/* ===== HELPERS ===== */
function rect(a,b){
  return a.x < b.x+b.w &&
         a.x+a.w > b.x &&
         a.y < b.y+b.h &&
         a.y+a.h > b.y;
}

function skinColor(name){
  if(name==="gold") return "#facc15";
  if(name==="ninja") return "#111827";
  if(name==="frog") return "#16a34a";
  return "#ef4444";
}

/* ===== UPDATE ===== */
function input(){
  if(keys["ArrowLeft"] || keys["a"]) me.vx = -4;
  else if(keys["ArrowRight"] || keys["d"]) me.vx = 4;
  else me.vx = 0;

  if((keys["ArrowUp"] || keys[" "] || keys["w"]) && me.ground){
    me.vy = -12;
    me.ground = false;
  }
}

function physics(){
  me.vy += gravity;

  me.x += me.vx;
  me.y += me.vy;

  me.ground = false;

  plats.forEach(p=>{
    if(rect(me,p)){
      if(me.vy >= 0 && me.y+me.h < p.y+24){
        me.y = p.y - me.h;
        me.vy = 0;
        me.ground = true;
      }
    }
  });

  spikes.forEach(s=>{
    if(rect(me,s)){
      respawn();
      me.score = Math.max(0, me.score - 20);
    }
  });

  coins.forEach(c=>{
    if(!c.t) return;
    if(rect(me,{x:c.x,y:c.y,w:24,h:24})){
      c.t = 0;
      me.coins++;
      me.score += 10;
    }
  });

  enemies.forEach(e=>{
    e.x += e.v;
    if(e.x < 450 || e.x > 1300) e.v *= -1;

    if(rect(me,e)){
      respawn();
      me.score = Math.max(0, me.score - 10);
    }
  });

  if(me.y > 900) respawn();
}

function respawn(){
  me.x = 120;
  me.y = 500;
  me.vx = 0;
  me.vy = 0;
}

/* ===== DRAW ===== */
function bg(){
  ctx.fillStyle = "#7dd3fc";
  ctx.fillRect(0,0,W,H);

  ctx.fillStyle = "#16a34a";
  ctx.fillRect(0,620,W,100);
}

function drawPlat(p){
  ctx.fillStyle = "#8b5a2b";
  ctx.fillRect(p.x,p.y,p.w,p.h);

  ctx.fillStyle = "#22c55e";
  ctx.fillRect(p.x,p.y,p.w,8);
}

function drawSpike(s){
  ctx.fillStyle = "#e5e7eb";

  for(let i=0;i<s.w;i+=20){
    ctx.beginPath();
    ctx.moveTo(s.x+i,s.y+s.h);
    ctx.lineTo(s.x+i+10,s.y);
    ctx.lineTo(s.x+i+20,s.y+s.h);
    ctx.fill();
  }
}

function drawCoin(c){
  if(!c.t) return;
  ctx.beginPath();
  ctx.arc(c.x+12,c.y+12,10,0,7);
  ctx.fillStyle = "gold";
  ctx.fill();
}

function drawEnemy(e){
  ctx.fillStyle = "#7c2d12";
  ctx.fillRect(e.x,e.y,e.w,e.h);
}

function drawPlayer(p,label){
  ctx.fillStyle = skinColor(p.skin);
  ctx.fillRect(p.x,p.y,34,18);

  ctx.fillStyle = "#2563eb";
  ctx.fillRect(p.x+6,p.y+18,22,28);

  ctx.fillStyle = "#fde68a";
  ctx.fillRect(p.x+8,p.y+4,18,12);

  ctx.fillStyle = "#fff";
  ctx.font = "16px Arial";
  ctx.fillText(label,p.x-4,p.y-8);
}

function render(){
  ctx.clearRect(0,0,W,H);

  bg();

  plats.forEach(drawPlat);
  spikes.forEach(drawSpike);
  coins.forEach(drawCoin);
  enemies.forEach(drawEnemy);

  for(let id in players){
    drawPlayer(players[id],players[id].name);
  }

  drawPlayer(me,"YOU");

  document.getElementById("coin").innerText = me.coins;
  document.getElementById("score").innerText = me.score;
}

/* ===== LOOP ===== */
function loop(){
  input();
  physics();

  socket.emit("move",{
    x: me.x,
    y: me.y,
    score: me.score,
    coins: me.coins,
    skin: me.skin
  });

  render();
  requestAnimationFrame(loop);
}

loop();
