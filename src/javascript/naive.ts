import { Particle, Engine } from './engine';

/**
 * Brute-force $O(n^2)$ evaluation algorithm.
 * Performs linear pair-wise intersection comparisons. 
 */
export async function processAllCollidingPairs(engine: Engine, callback: (p1: Particle, p2: Particle) => void | Promise<void>): Promise<void> {
  const particles = engine.particles;
  // Iterates over $n(n-1)/2$ combinations to mitigate symmetric and self-evaluations.
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      // check AABB first
      const p1 = particles[i];
      const p2 = particles[j];
      if (p1.pos.x + p1.radius < p2.pos.x - p2.radius ||
          p1.pos.x - p1.radius > p2.pos.x + p2.radius ||
          p1.pos.y + p1.radius < p2.pos.y - p2.radius ||
          p1.pos.y - p1.radius > p2.pos.y + p2.radius) {
        continue;
      }

      const r = callback(particles[i], particles[j]);
    
      if (r instanceof Promise) {
        await r;
      }
    }
  }
}
