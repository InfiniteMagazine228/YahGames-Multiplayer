const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = {};
let leaderboard = [];

function topBoard(){
  leaderboard = Object.values(players)
    .sort((a,b)=>b.score-a.score)
    .slice(0,10)
    .map(p=>({
      name:p.name,
      score:p.score,
      coins:p.coins,
      skin:p.skin
    }));
}

io.on("connection",(socket)=>{

  players[socket.id] = {
    id:socket.id,
    name:"Player",
    x:100,
    y:420,
    vx:0,
    vy:0,
    score:0,
    coins:0,
    skin:"classic",
    online:true
  };

  socket.emit("you", socket.id);

  socket.on("join",(data)=>{
    if(data.name) players[socket.id].name = data.name.substring(0,16);
    if(data.skin) players[socket.id].skin = data.skin;
  });

  socket.on("move",(data)=>{
    const p = players[socket.id];
    if(!p) return;

    p.x = data.x;
    p.y = data.y;
    p.vx = data.vx || 0;
    p.vy = data.vy || 0;
    p.score = data.score || 0;
    p.coins = data.coins || 0;
    p.skin = data.skin || p.skin;
  });

  socket.on("disconnect",()=>{
    delete players[socket.id];
  });
});

setInterval(()=>{
  topBoard();
  io.emit("state",{
    players,
    leaderboard
  });
},50);

const PORT = process.env.PORT || 3000;
server.listen(PORT,()=>console.log("Running on "+PORT));
