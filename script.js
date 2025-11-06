const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const DISCORD_CLIENT_ID = "1435854292002279556"; // <--- Replace
const REDIRECT_URI = "https://yodabattle3.github.io/Dodge-the-Blocks/";
const WEBHOOK_URL = "https://discord.com/api/webhooks/1426277633259470919/QFLDubjOeM5DRpQ-VHlXMEOKgbgWlG0q-EnuTgAbdn67F8osnjiS_CFAF-DJ5jtswA8i"; // <--- Replace

let discordUser = null;

const player = { x: 180, y: 550, width: 40, height: 40, color: "#00adb5", speed: 6, vx: 0 };
let obstacles = [];
let keys = {};
let gameOver = false;
let score = 0;
let currentSkin = localStorage.getItem("skinColor") || "#00adb5";

const menu = document.getElementById("menu");
const gameUI = document.getElementById("gameUI");
const leaderboardMenu = document.getElementById("leaderboardMenu");
const leaderboardList = document.getElementById("leaderboardList");

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// Discord OAuth login
document.getElementById("loginBtn").addEventListener("click", () => {
  const authUrl =
    `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=token&scope=identify`;
  window.location = authUrl;
});

// If redirected from Discord OAuth
if (window.location.hash.includes("access_token")) {
  const token = new URLSearchParams(window.location.hash.substr(1)).get("access_token");
  window.history.replaceState({}, document.title, "/");

  fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(user => {
      discordUser = user;
      document.getElementById("userDisplay").textContent = `Logged in as ${user.username}`;
      document.getElementById("loginBtn").style.display = "none";
      document.getElementById("playBtn").disabled = false;
    });
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function createObstacle() {
  const width = Math.random() * 60 + 20;
  const x = Math.random() * (canvas.width - width);
  obstacles.push({ x, y: -40, width, height: 20, speed: 3 + Math.random() * 3 });
}

function drawObstacles() {
  ctx.fillStyle = "#ff2e63";
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.width, o.height));
}

function updateObstacles() {
  obstacles.forEach(o => o.y += o.speed);
  obstacles = obstacles.filter(o => o.y < canvas.height + 50);
}

function checkCollision(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function updatePlayer() {
  if (keys["ArrowLeft"]) player.vx -= 0.6;
  if (keys["ArrowRight"]) player.vx += 0.6;
  player.vx *= 0.9;
  player.vx = Math.max(Math.min(player.vx, player.speed), -player.speed);
  player.x += player.vx;
  player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));
}

function saveScore(score) {
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");
  const username = discordUser ? discordUser.username : "Guest";
  leaderboard.push({ username, score, date: new Date().toLocaleString() });
  leaderboard.sort((a, b) => b.score - a.score);
  if (leaderboard.length > 10) leaderboard.length = 10;
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));

  // send to webhook
  fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: "🏆 New Score!",
        description: `**@${username}** scored **${score}** points!`,
        color: 0x00adb5
      }]
    })
  });
}

function showLeaderboard() {
  leaderboardList.innerHTML = "";
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");
  leaderboard.forEach((entry, i) => {
    const li = document.createElement("li");
    li.textContent = `#${i + 1} - ${entry.username}: ${entry.score} pts (${entry.date})`;
    leaderboardList.appendChild(li);
  });
}

function gameLoop() {
  if (gameOver) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePlayer();
  drawPlayer();
  drawObstacles();
  updateObstacles();

  obstacles.forEach(o => {
    if (checkCollision(player, o)) {
      gameOver = true;
      saveScore(score);
      alert(`💥 Game Over! Score: ${score}`);
      showMenu();
    }
  });

  score++;
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);

  requestAnimationFrame(gameLoop);
}

function startGame() {
  player.x = 180;
  player.vx = 0;
  player.color = currentSkin;
  obstacles = [];
  score = 0;
  gameOver = false;
  menu.classList.add("hidden");
  gameUI.classList.remove("hidden");
  setInterval(createObstacle, 800);
  gameLoop();
}

function showMenu() {
  gameUI.classList.add("hidden");
  leaderboardMenu.classList.add("hidden");
  menu.classList.remove("hidden");
}

document.getElementById("playBtn").onclick = startGame;
document.getElementById("leaderboardBtn").onclick = () => {
  menu.classList.add("hidden");
  leaderboardMenu.classList.remove("hidden");
  showLeaderboard();
};
document.getElementById("backFromLeaderboard").onclick = showMenu;
document.getElementById("menuBtn").onclick = showMenu;
document.getElementById("restartBtn").onclick = startGame;

// Skins
document.querySelectorAll(".skin").forEach(skin => {
  skin.addEventListener("click", () => {
    currentSkin = skin.getAttribute("data-color");
    localStorage.setItem("skinColor", currentSkin);
    alert("✅ Skin selected!");
  });
});


