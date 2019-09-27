// Learn more about this file at:
// https://victorzhou.com/blog/build-an-io-game-part-1/#5-client-rendering
import { debounce } from 'throttle-debounce';
import { getAsset } from './assets';
import { getCurrentState } from './state';

const Constants = require('../shared/constants');

const { PLAYER_RADIUS, PLAYER_MAX_HP, BULLET_RADIUS, MAP_SIZE_X, MAP_SIZE_Y } = Constants;

// Get the canvas graphics context
const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');
setCanvasDimensions();

window.addEventListener('resize', debounce(40, setCanvasDimensions));

function setCanvasDimensions() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function render() {
  const { me, others, bullets, obstacles } = getCurrentState();

  if (!me) {
    return;
  }

  // Draw background
  renderBackground();

  // Draw boundaries
  context.strokeStyle = 'black';
  context.lineWidth = 1;
  context.strokeRect(canvas.width / 2 - MAP_SIZE_X / 2, canvas.height / 2 - MAP_SIZE_Y / 2, MAP_SIZE_X, MAP_SIZE_Y);

  // Draw objects on canvas
  renderPlayer(me, me);
  others.forEach(renderPlayer.bind(null, me));
  bullets.forEach(renderBullet.bind(null, me));
  obstacles.forEach(renderObstacle.bind(null, me));
}

function renderBackground() {
  const backgroundX = canvas.width / 2;
  const backgroundY = canvas.height / 2;
  const backgroundGradient = context.createRadialGradient(
    backgroundX,
    backgroundY,
    canvas.height / 2 / 10,
    backgroundX,
    backgroundY,
    canvas.height / 2,
  );
  backgroundGradient.addColorStop(0, 'blue');
  backgroundGradient.addColorStop(1, 'gray');
  context.fillStyle = backgroundGradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

// Renders a ship at the given coordinates
function renderPlayer(me, player) {
  const { x, y, direction, image } = player;
  const canvasX = x + (canvas.width / 2 - MAP_SIZE_X / 2); // canvas.width / 2 ;//+ x; - me.x;
  const canvasY = y + (canvas.height / 2 - MAP_SIZE_Y / 2); // canvas.height / 2;//+ y; - me.y;
  updateHealth(me.hp);

  // Draw ship
  context.save();
  context.translate(canvasX, canvasY);

  context.rotate(direction);
  context.drawImage(
    getAsset(image),
    -PLAYER_RADIUS,
    -PLAYER_RADIUS,
    PLAYER_RADIUS * 2,
    PLAYER_RADIUS * 2,
  );
  context.restore();

  // Draw health bar
  context.fillStyle = 'white';
  context.fillRect(
    canvasX - PLAYER_RADIUS,
    canvasY + PLAYER_RADIUS + 8,
    PLAYER_RADIUS * 2,
    2,
  );
  context.fillStyle = 'red';
  context.fillRect(
    canvasX - PLAYER_RADIUS + PLAYER_RADIUS * 2 * player.hp / PLAYER_MAX_HP,
    canvasY + PLAYER_RADIUS + 8,
    PLAYER_RADIUS * 2 * (1 - player.hp / PLAYER_MAX_HP),
    2,
  );
}

function updateHealth(hp) {
  document.getElementById('health_number').innerHTML = `<center>- ${hp} -</center>`;
}

function renderBullet(me, bullet) {
  const { x, y } = bullet;
  context.drawImage(
    getAsset('bullet.svg'),
	 x + (canvas.width / 2 - MAP_SIZE_X / 2),
	 y + (canvas.height / 2 - MAP_SIZE_Y / 2),
    BULLET_RADIUS * 2,
    BULLET_RADIUS * 2,
  );
}

function renderObstacle(me, obstacle) {
  const { x, y, direction, width, height } = obstacle;
  const cX = x + (canvas.width / 2 - MAP_SIZE_X / 2);
  const cY = y + (canvas.height / 2 - MAP_SIZE_Y / 2);

  context.save();

  context.translate(cX, cY);
  context.rotate(direction);

  context.drawImage(
    getAsset('basic_obstacle.png'),
	 0,
	 0,
    width,
    height,
  );
  // context.rotate(0);
  // context.translate(-cX, -cY);
  context.restore();
}

function renderMainMenu() {
  const t = Date.now() / 7500;
  const x = MAP_SIZE_X / 2 + 800 * Math.cos(t);
  const y = MAP_SIZE_Y / 2 + 800 * Math.sin(t);
  renderBackground(x, y);
}

let renderInterval = setInterval(renderMainMenu, 1000 / 60);

// Replaces main menu rendering with game rendering.
export function startRendering() {
  clearInterval(renderInterval);
  renderInterval = setInterval(render, 1000 / 60);
}

// Replaces game rendering with main menu rendering.
export function stopRendering() {
  clearInterval(renderInterval);
  renderInterval = setInterval(renderMainMenu, 1000 / 60);
}
