// FILE 2: server.js

const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const PORT = process.env.PORT || 3000;

// public folder
app.use(express.static("public"));

let players = {};
let leaderboard = [];

// join
io.on("connection", (socket) => {
  console.log("User joined:", socket.id);

  players[socket.id] = {
    id: socket.id,
    name: "Player_" + socket.id.slice(0,4),
    x: 120,
    y: 380,
    skin: "classic",
    score: 0,
    coins: 0
  };

  socket.emit("currentPlayers", players);
  socket.broadcast.emit("newPlayer", players[socket.id]);

  // update player
  socket.on("updatePlayer", (data) => {
    if (!players[socket.id]) return;

    players[socket.id] = {
      ...players[socket.id],
      ...data
    };

    io.emit("playersUpdate", players);
  });

  // leaderboard
  socket.on("submitScore", (score) => {
    if (!players[socket.id]) return;

    leaderboard.push({
      name: players[socket.id].name,
      score: score
    });

    leaderboard.sort((a,b)=>b.score-a.score);
    leaderboard = leaderboard.slice(0,10);

    io.emit("leaderboardUpdate", leaderboard);
  });

  // rename
  socket.on("setName",(name)=>{
    if(players[socket.id]){
      players[socket.id].name = name.substring(0,15);
    }
  });

  // disconnect
  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("playersUpdate", players);
    console.log("User left:", socket.id);
  });
});

http.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
