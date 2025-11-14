const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// SETTINGS
const DISCORD_CLIENT_ID = "1435854292002279556";
const REDIRECT_URI = "https://yodabattle3.github.io/Dodge-the-Blocks/";
const WEBHOOK_URL = "https://discord.com/api/webhooks/1426277633259470919/QFLDubjOeM5DRpQ-VHlXMEOKgbgWlG0q-EnuTgAbdn67F8osnjiS_CFAF-DJ5jtswA8i";

// GAME VARS
let discordUser = null;
let player = { x: 180, y: 550, width: 40, height: 40, color: "#00adb5", speed: 6, vx: 0 };
let obstacles = [];
let keys = {};
let score = 0;
let gameOver = false;
let spawnInterval = null;
let currentSkin = localStorage.getItem("skinColor") || "#00adb5";

// DOM
const menu = document.getElementById("menu");
const gameUI = document.getElementById("gameUI");
const leaderboardMenu = document.getElementById("leaderboardMenu");
const leaderboardList = document.getElementById("leaderboardList");

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// DISCORD LOGIN
document.getElementById("loginBtn").onclick = () => {
  const url =
    `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=token&scope=identify`;
  window.location = url;
};

if (window.location.hash.includes("access_token")) {
  const token = new URLSearchParams(window.location.hash.substr(1)).get("access_token");
  window.history.replaceState({}, document.title, REDIRECT_URI);

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

// GAME FUNCTIONS
function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.shadowColor = player.color;
  ctx.shadowBlur = 20;
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.shadowBlur = 0;
}

function createObstacle() {
  const width = Math.random() * 60 + 20;
  const x = Math.random() * (canvas.width - width);
  obstacles.push({
    x, y: -40,
    width, height: 20,
    speed: 3 + Math.random() * 3
  });
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
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

function updatePlayer() {
  if (keys["ArrowLeft"]) player.vx -= 0.5;
  if (keys["ArrowRight"]) player.vx += 0.5;
  player.vx *= 0.88;
  player.vx = Math.max(Math.min(player.vx, player.speed), -player.speed);
  player.x += player.vx;
  player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));
}

function saveScore(score) {
  const username = discordUser ? discordUser.username : "Guest";
  const data = JSON.parse(localStorage.getItem("leaderboard") || "[]");

  data.push({ username, score, date: new Date().toLocaleString() });
  data.sort((a, b) => b.score - a.score);
  if (data.length > 10) data.length = 10;
  localStorage.setItem("leaderboard", JSON.stringify(data));

  fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: "🏆 New High Score!",
        description: `**${username}** scored **${score}** points!`,
        color: 0x00eaff,
        timestamp: new Date()
      }]
    })
  });
}

function showLeaderboard() {
  leaderboardList.innerHTML = "";
  const data = JSON.parse(localStorage.getItem("leaderboard") || "[]");

  data.forEach((entry, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>#${i + 1}</strong> — ${entry.username}: ${entry.score} pts <br><span style="font-size:12px;opacity:0.6">${entry.date}</span>`;
    leaderboardList.appendChild(li);
  });
}

// GAME LOOP
function gameLoop() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updatePlayer();
  drawPlayer();

  drawObstacles();
  updateObstacles();

  for (let o of obstacles) {
    if (checkCollision(player, o)) {
      gameOver = true;
      saveScore(score);
      alert(`💥 Game Over! Score: ${score}`);
      showMenu();
      return;
    }
  }

  score++;
  ctx.fillStyle = "white";
  ctx.font = "22px Arial";
  ctx.fillText("Score: " + score, 10, 30);

  requestAnimationFrame(gameLoop);
}

// MENU / START
function startGame() {
  player.x = 180;
  player.vx = 0;
  player.color = currentSkin;
  obstacles = [];
  score = 0;
  gameOver = false;

  clearInterval(spawnInterval);
  spawnInterval = setInterval(createObstacle, 700);

  menu.classList.add("hidden");
  leaderboardMenu.classList.add("hidden");
  gameUI.classList.remove("hidden");

  gameLoop();
}

function showMenu() {
  gameUI.classList.add("hidden");
  leaderboardMenu.classList.add("hidden");
  menu.classList.remove("hidden");
}

// BUTTONS
document.getElementById("playBtn").onclick = startGame;
document.getElementById("leaderboardBtn").onclick = () => {
  menu.classList.add("hidden");
  leaderboardMenu.classList.remove("hidden");
  showLeaderboard();
};
document.getElementById("menuBtn").onclick = showMenu;
document.getElementById("restartBtn").onclick = startGame;

// SKINS
document.querySelectorAll(".skin").forEach(skin => {
  skin.onclick = () => {
    currentSkin = skin.dataset.color;
    localStorage.setItem("skinColor", currentSkin);
    alert("✅ Skin Selected!");
  };
});

document.getElementById("backFromSkins").onclick = showMenu;
document.getElementById("skinsBtn").onclick = () => {
  menu.classList.add("hidden");
  document.getElementById("skinsMenu").classList.remove("hidden");
};
