import { Particle, Engine } from './engine';
import { processAllCollidingPairs as evaluateNaive } from './naive';
import { processAllCollidingPairs as evaluateQuadtree } from './quadtree';

// Element References 
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const tpsDisplay = document.getElementById('tpsDisplay') as HTMLDivElement;
const algoSelect = document.getElementById('algorithm') as HTMLSelectElement;
const countSelect = document.getElementById('particleCount') as HTMLSelectElement;

// State Variables 
let engine: Engine;
let tpsCounter = 0;
let isRunning = true;

// Helper: yield to event loop.
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
  const particles: Particle[] = [];
  const radius = 4;

  for (let i = 0; i < count; i++) {
    const r = radius;
    // ensure within bounds
    const x = r + Math.random() * (canvas.width - r * 2);
    const y = r + Math.random() * (canvas.height - r * 2);
    
    // random velocity approx [-2, 2]
    const vx = (Math.random() - 0.5) * 4;
    const vy = (Math.random() - 0.5) * 4;

    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 80%, 60%)`;

    particles.push(new Particle(x, y, r, vx, vy, color));
  }
  
  if (engine) {
    engine.particles = particles;
  }
}

/**
 * Canvas rendering cycle.
 */
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!engine) return;

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
(async function runPhysicsLoop() {
  engine = new Engine(evaluateQuadtree);
  resize(); // sets canvas sizing and runs initializeSimulation()

  setInterval(() => {
    tpsDisplay.textContent = `TPS: ${tpsCounter}`;
    tpsCounter = 0;
  }, 1000);

  while (isRunning) {
    const algo = algoSelect.value;
    
    if (algo === 'naive') {
      engine.setProcessor(evaluateNaive);
    } else {
      engine.setProcessor(evaluateQuadtree);
    }

    engine.tick();
    render();

    tpsCounter++;

    // Yield back to the browser's UI thread temporarily without
    // bottlenecking at the screen refresh rate like rAF. 
    await sleep(0);
  }
})();

countSelect.addEventListener('change', () => {
    initializeSimulation();
});
