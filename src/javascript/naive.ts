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
      await callback(particles[i], particles[j]);
    }
  }
}
