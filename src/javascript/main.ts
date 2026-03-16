import { Particle, Engine } from './engine';
import { processAllCollidingPairs as evaluateNaive } from './naive';
import { processAllCollidingPairs as evaluateQuadtree } from './quadtree';

// Element References 
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
ctx.imageSmoothingEnabled = false;
const tpsDisplay = document.getElementById('tpsDisplay') as HTMLDivElement;
const algoSelect = document.getElementById('algorithm') as HTMLSelectElement;
const countSelect = document.getElementById('particleCount') as HTMLSelectElement;
const bucketSelect = document.getElementById('bucketSize') as HTMLSelectElement;
const speedSelect = document.getElementById('speed') as HTMLSelectElement;
const playPauseBtn = document.getElementById('playPauseBtn') as HTMLButtonElement;
const stepBtn = document.getElementById('stepBtn') as HTMLButtonElement;

// State Variables 
let engine: Engine;
let tpsCounter = 0;
let isRunning = true;
let isPaused = false;
let stepRequested = false;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (engine) {
    engine.width = canvas.width;
    engine.height = canvas.height;
    initializeSimulation();
  }
}

window.addEventListener('resize', resize);

/**
 * Instantiates the physical simulation environment.
 */
function initializeSimulation() {
  const count = parseInt(countSelect.value, 10);
  const speed = parseFloat(speedSelect.value);
  const particles: Particle[] = [];
  const radius = 4;

  for (let i = 0; i < count; i++) {
    const r = radius;
    // ensure within bounds
    const x = r + Math.random() * (canvas.width - r * 2);
    const y = r + Math.random() * (canvas.height - r * 2);

    const angle = Math.random() * Math.PI * 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 80%, 60%)`;

    particles.push(new Particle(x, y, r, vx, vy, color));
  }

  if (engine) {
    engine.particles = particles;
    engine.maxRadius = radius;
  }
}

/**
 * Canvas rendering cycle.
 */
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!engine) return;

  engine.drawQuadTree(ctx);

  for (const p of engine.particles) {
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.closePath();
  }
}

const MAX_TPS = 500;

/**
 * Continuous simulation event loop.
 */
(async function runPhysicsLoop() {
  engine = new Engine(evaluateNaive);
  resize(); // sets canvas sizing and runs initializeSimulation()

  setInterval(() => {
    tpsDisplay.textContent = `TPS: ${tpsCounter} / ${MAX_TPS}`;
    tpsCounter = 0;
  }, 1000);

  let nextFrame = Date.now() + 1000 / MAX_TPS;

  while (isRunning) {
    const algo = algoSelect.value;
    const bucketSize = parseInt(bucketSelect.value, 10);

    if (!isPaused || stepRequested) {
      if (algo === 'naive') {
        engine.initQuadTree(null);
        engine.setProcessor(evaluateNaive);
      } else {
        engine.setProcessor(evaluateQuadtree);
      }
      engine.bucketSize = bucketSize;

      await engine.tick();
      render();

      if (stepRequested) {
        stepRequested = false;
      }

      tpsCounter++;
    } else {
      // Just render the current state when paused (in case we resize or change colors)
      render();
    }

    // wait until next frame tick
    const now = Date.now();
    await sleep(nextFrame - now);

    // If we're running behind
    nextFrame = Math.max(nextFrame + 1000 / MAX_TPS, now);
  }
})();

playPauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    playPauseBtn.textContent = isPaused ? 'Play' : 'Pause';
    stepBtn.disabled = !isPaused;
});

stepBtn.addEventListener('click', () => {
    if (isPaused) {
        stepRequested = true;
    }
});

countSelect.addEventListener('change', () => {
    initializeSimulation();
});

speedSelect.addEventListener('change', () => {
    initializeSimulation();
});
