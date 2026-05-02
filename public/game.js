const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

let myId = null;

const keys = {};
const gravity = 0.6;

let me = {
x:120,
y:500,
w:34,
h:46,
vx:0,
vy:0,
ground:false,
score:0,
coins:0,
skin:"classic",
name:"Player"
};

let players = {};
let leaderboard = [];

const plats = [
{x:0,y:620,w:2000,h:100},
{x:300,y:520,w:180,h:30},
{x:620,y:470,w:180,h:30},
{x:920,y:420,w:180,h:30},
{x:1280,y:520,w:220,h:30},
{x:1620,y:450,w:180,h:30}
];

const spikes = [
{x:760,y:600,w:120,h:20},
{x:1450,y:600,w:120,h:20}
];

const coins = [
{x:340,y:470,t:1},
{x:390,y:470,t:1},
{x:680,y:420,t:1},
{x:730,y:420,t:1},
{x:980,y:370,t:1},
{x:1030,y:370,t:1},
{x:1330,y:470,t:1}
];

const enemies = [
{x:520,y:585,w:34,h:34,v:2},
{x:1160,y:585,w:34,h:34,v:-2}
];

function rect(a,b){
return a.x<b.x+b.w &&
a.x+a.w>b.x &&
a.y<b.y+b.h &&
a.y+a.h>b.y;
}

socket.on("you",(id)=>myId=id);

socket.on("state",(data)=>{
players = data.players;
leaderboard = data.leaderboard || [];
document.getElementById("online").innerText =
"Online: "+Object.keys(players).length;
drawBoard();
});

function drawBoard(){
let html="";
leaderboard.forEach((p,i)=>{
html += `${i+1}. ${p.name} (${p.score})<br>`;
});
document.getElementById("board").innerHTML = html;
}

document.getElementById("joinBtn").onclick=()=>{
me.name = document.getElementById("name").value || "Player";
me.skin = document.getElementById("skin").value;
socket.emit("join",{
name:me.name,
skin:me.skin
});
};

function input(){
if(keys["ArrowLeft"]||keys["a"]){me.vx=-4;}
else if(keys["ArrowRight"]||keys["d"]){me.vx=4;}
else me.vx=0;

if((keys["ArrowUp"]||keys[" "]||keys["w"]) && me.ground){
me.vy=-12;
me.ground=false;
}
}

function physics(){
me.vy += gravity;
me.x += me.vx;
me.y += me.vy;
me.ground=false;

plats.forEach(p=>{
if(rect(me,p)){
if(me.vy>=0 && me.y+me.h< p.y+25){
me.y = p.y-me.h;
me.vy = 0;
me.ground = true;
}
}
});

spikes.forEach(s=>{
if(rect(me,{x:s.x,y:s.y,w:s.w,h:s.h})){
me.x=120;
me.y=500;
me.score=Math.max(0,me.score-20);
}
});

coins.forEach(c=>{
if(!c.t) return;
if(rect(me,{x:c.x,y:c.y,w:24,h:24})){
c.t=0;
me.coins++;
me.score+=10;
}
});

enemies.forEach(e=>{
e.x += e.v;
if(e.x<420||e.x>1300)e.v*=-1;

if(rect(me,e)){
me.x=120;
me.y=500;
me.score=Math.max(0,me.score-10);
}
});

if(me.y>800){
me.x=120;
me.y=500;
me.vy=0;
}
}

function drawBg(){
ctx.fillStyle="#38bdf8";
ctx.fillRect(0,0,W,H);

ctx.fillStyle="#15803d";
ctx.fillRect(0,620,W,100);
}

function drawPlat(p){
ctx.fillStyle="#8b5a2b";
ctx.fillRect(p.x,p.y,p.w,p.h);

ctx.fillStyle="#22c55e";
ctx.fillRect(p.x,p.y,p.w,8);
}

function drawCoin(c){
if(!c.t)return;
ctx.beginPath();
ctx.arc(c.x+12,c.y+12,10,0,7);
ctx.fillStyle="gold";
ctx.fill();
}

function drawSpike(s){
ctx.fillStyle="#ddd";
for(let i=0;i<s.w;i+=20){
ctx.beginPath();
ctx.moveTo(s.x+i,s.y+s.h);
ctx.lineTo(s.x+i+10,s.y);
ctx.lineTo(s.x+i+20,s.y+s.h);
ctx.fill();
}
}

function drawEnemy(e){
ctx.fillStyle="#7c2d12";
ctx.fillRect(e.x,e.y,e.w,e.h);
}

function skinColor(name){
if(name==="gold") return "#facc15";
if(name==="ninja") return "#111827";
if(name==="frog") return "#16a34a";
return "#ef4444";
}

function drawPlayer(p,isMe=false){
ctx.fillStyle=skinColor(p.skin||"classic");
ctx.fillRect(p.x,p.y,34,20);

ctx.fillStyle="#2563eb";
ctx.fillRect(p.x+6,p.y+20,22,26);

ctx.fillStyle="#fde68a";
ctx.fillRect(p.x+8,p.y+6,18,12);

ctx.fillStyle="#fff";
ctx.font="16px Arial";
ctx.fillText(isMe?"YOU":p.name,p.x-5,p.y-8);
}

function render(){
ctx.clearRect(0,0,W,H);

drawBg();

plats.forEach(drawPlat);
coins.forEach(drawCoin);
spikes.forEach(drawSpike);
enemies.forEach(drawEnemy);

for(let id in players){
drawPlayer(players[id],id===myId);
}

drawPlayer(me,true);

document.getElementById("coin").innerText=me.coins;
document.getElementById("score").innerText=me.score;
}

function loop(){
input();
physics();

socket.emit("move",{
x:me.x,
y:me.y,
vx:me.vx,
vy:me.vy,
score:me.score,
coins:me.coins,
skin:me.skin
});

render();
requestAnimationFrame(loop);
}

window.onkeydown=e=>keys[e.key]=true;
window.onkeyup=e=>keys[e.key]=false;

function hold(id,key){
const b=document.getElementById(id);
b.onpointerdown=()=>keys[key]=true;
b.onpointerup=()=>keys[key]=false;
b.onpointerleave=()=>keys[key]=false;
}
hold("left","ArrowLeft");
hold("right","ArrowRight");
hold("jump","ArrowUp");

loop();
