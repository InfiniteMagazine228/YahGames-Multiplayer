// FILE 4: public/game.js

const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const coinsEl = document.getElementById("coins");
const onlineEl = document.getElementById("online");
const boardEl = document.getElementById("leaderboard");

let keys = {};

let me = {
  x: 120,
  y: 380,
  w: 34,
  h: 46,
  vx: 0,
  vy: 0,
  onGround: false,
  score: 0,
  coins: 0,
  skin: "classic",
  name: "Player"
};

let others = {};

const gravity = 0.6;
const floorY = 430;

/* =========================
INPUT
========================= */
window.addEventListener("keydown", e => {
  keys[e.code] = true;
});

window.addEventListener("keyup", e => {
  keys[e.code] = false;
});

function hold(id, code){
  const btn = document.getElementById(id);
  btn.addEventListener("pointerdown", ()=>keys[code]=true);
  btn.addEventListener("pointerup", ()=>keys[code]=false);
  btn.addEventListener("pointerleave", ()=>keys[code]=false);
}
hold("leftBtn","ArrowLeft");
hold("rightBtn","ArrowRight");
hold("jumpBtn","Space");

/* =========================
BUTTONS
========================= */

document.getElementById("saveName").onclick = ()=>{
  const n = document.getElementById("nameInput").value.trim();
  if(!n) return;
  me.name = n;
  socket.emit("setName", n);
};

document.getElementById("submitScore").onclick = ()=>{
  socket.emit("submitScore", me.score);
};

document.querySelectorAll(".skinBtn").forEach(btn=>{
  btn.onclick = ()=>{
    me.skin = btn.dataset.skin;
  };
});

/* =========================
SOCKET
========================= */

socket.on("currentPlayers", data=>{
  others = data;
});

socket.on("newPlayer", data=>{
  others[data.id] = data;
});

socket.on("playersUpdate", data=>{
  others = data;
  onlineEl.textContent = Object.keys(data).length;
});

socket.on("leaderboardUpdate", list=>{
  boardEl.innerHTML = list.map((p,i)=>
    `${i+1}. ${p.name} - ${p.score}`
  ).join("<br>");
});

/* =========================
GAME
========================= */

function update(){

  // move
  if(keys.ArrowLeft){
    me.vx = -4;
  }else if(keys.ArrowRight){
    me.vx = 4;
  }else{
    me.vx = 0;
  }

  if(keys.Space && me.onGround){
    me.vy = -12;
    me.onGround = false;
  }

  me.vy += gravity;

  me.x += me.vx;
  me.y += me.vy;

  // floor
  if(me.y + me.h >= floorY){
    me.y = floorY - me.h;
    me.vy = 0;
    me.onGround = true;
  }

  // walls
  if(me.x < 0) me.x = 0;
  if(me.x > 920) me.x = 920;

  // fake coin gain
  if(Math.random() < 0.01){
    me.coins++;
    me.score += 5;
  }

  scoreEl.textContent = me.score;
  coinsEl.textContent = me.coins;

  socket.emit("updatePlayer",{
    x: me.x,
    y: me.y,
    skin: me.skin,
    score: me.score,
    coins: me.coins,
    name: me.name
  });
}

/* =========================
DRAW
========================= */

function bg(){
  const g = ctx.createLinearGradient(0,0,0,540);
  g.addColorStop(0,"#38bdf8");
  g.addColorStop(1,"#2563eb");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,960,540);

  // ground
  ctx.fillStyle = "#15803d";
  ctx.fillRect(0,430,960,110);
}

function drawPlayer(p,isMe=false){

  const x = p.x;
  const y = p.y;

  let hat="#ef4444", body="#2563eb", face="#fde68a";

  if(p.skin==="gold"){hat="#facc15";body="#eab308";}
  if(p.skin==="shadow"){hat="#111";body="#333";face="#888";}
  if(p.skin==="frog"){hat="#16a34a";body="#22c55e";}
  if(p.skin==="ice"){hat="#60a5fa";body="#2563eb";}
  if(p.skin==="galaxy"){hat="#9333ea";body="#7c3aed";}

  // legs
  ctx.fillStyle = body;
  ctx.fillRect(x+6,y+30,8,16);
  ctx.fillRect(x+20,y+30,8,16);

  // body
  ctx.fillRect(x+5,y+18,24,16);

  // head
  ctx.fillStyle = face;
  ctx.fillRect(x+8,y+6,20,14);

  // hat
  ctx.fillStyle = hat;
  ctx.fillRect(x+5,y,25,8);

  // eye
  ctx.fillStyle="#000";
  ctx.fillRect(x+21,y+11,3,3);

  // text
  ctx.fillStyle="#fff";
  ctx.font="12px Arial";
  ctx.fillText(p.name || "Player", x-5, y-8);

  if(isMe){
    ctx.fillText("YOU", x+2, y-20);
  }
}

function draw(){

  bg();

  // other players
  for(let id in others){
    const p = others[id];
    if(!p) continue;
    drawPlayer(p,false);
  }

  // me
  drawPlayer(me,true);

  // title
  ctx.fillStyle="#fff";
  ctx.font="bold 20px Arial";
  ctx.fillText("Plumber Quest Online",20,30);
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
