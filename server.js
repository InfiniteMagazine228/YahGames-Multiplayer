FILE 2/8 — server.js

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

/* ===== DATA ===== */
let players = {};
let leaderboard = [];

/* ===== HELPERS ===== */
function updateBoard() {
  leaderboard = Object.values(players)
    .map(p => ({
      name: p.name,
      score: p.score || 0,
      coins: p.coins || 0,
      skin: p.skin || "classic"
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function publicPlayers() {
  const out = {};
  for (const id in players) {
    out[id] = {
      id,
      name: players[id].name,
      x: players[id].x,
      y: players[id].y,
      skin: players[id].skin,
      score: players[id].score,
      coins: players[id].coins
    };
  }
  return out;
}

/* ===== SOCKET ===== */
io.on("connection", socket => {
  socket.emit("you", socket.id);

  players[socket.id] = {
    id: socket.id,
    name: "Player",
    x: 120,
    y: 500,
    skin: "classic",
    score: 0,
    coins: 0
  };

  socket.on("join", data => {
    if (!players[socket.id]) return;

    players[socket.id].name =
      String(data.name || "Player").substring(0, 16);

    players[socket.id].skin =
      data.skin || "classic";
  });

  socket.on("move", data => {
    if (!players[socket.id]) return;

    players[socket.id].x = data.x;
    players[socket.id].y = data.y;
    players[socket.id].score = data.score || 0;
    players[socket.id].coins = data.coins || 0;
    players[socket.id].skin = data.skin || "classic";
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
  });
});

/* ===== GAME LOOP ===== */
setInterval(() => {
  updateBoard();

  io.emit("state", {
    players: publicPlayers(),
    leaderboard
  });
}, 1000 / 20);

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
