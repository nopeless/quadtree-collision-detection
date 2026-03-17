import { describe, it, expect } from 'vitest';
import { Engine, Particle } from '../src/javascript/engine';
import { processAllCollidingPairsKeep } from '../src/javascript/quadtree-keep';

describe('QuadTreeKeep Issue', () => {
  it('particles collide perfectly', () => {
    const engine = new Engine(processAllCollidingPairsKeep as any, [], 10);
    engine.width = 100;
    engine.height = 100;

    const p1 = new Particle(10, 50, 5, 2, 0); // moves right
    const p2 = new Particle(90, 50, 5, -2, 0); // moves left
    engine.particles.push(p1, p2);

    for(let i=0; i<30; i++) {
        engine.tick();
        console.log(`Tick ${i}: p1=(${p1.pos.x.toFixed(2)}, ${p1.pos.y.toFixed(2)}) p2=(${p2.pos.x.toFixed(2)}, ${p2.pos.y.toFixed(2)})`);
    }
  });
});
