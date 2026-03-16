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
let isRunning = true;
let isPaused = false;
let stepRequested = false;

let fpsCounter = 0;
let tickCount = 0;
let tickMs = 0;

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

/**
 * Continuous simulation event loop.
 */
function runPhysicsLoop() {
  engine = new Engine(evaluateNaive);
  resize(); // sets canvas sizing and runs initializeSimulation()

  setInterval(() => {
    const avg = tickCount === 0 ? 0 : tickMs / tickCount;
    tpsDisplay.textContent = `FPS: ${fpsCounter} / Avg Tick: ${avg.toFixed(2)}ms`;
    fpsCounter = 0;
    tickCount = 0;
    tickMs = 0;
  }, 1000);

  async function loop() {
    if (!isRunning) return;

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

      const tickStart = performance.now();
      await engine.tick();
      const currentTickMs = performance.now() - tickStart;
      tickMs += currentTickMs;
      tickCount++;
      
      render();

      if (stepRequested) {
        stepRequested = false;
      }

      fpsCounter++;
    } else {
      // Just render the current state when paused (in case we resize or change colors)
      render();
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

runPhysicsLoop();

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
