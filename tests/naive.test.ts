import { describe, it, expect } from 'vitest';
import { Particle, Engine } from '../src/javascript/engine';
import { processAllCollidingPairs as evaluateNaive } from '../src/javascript/naive';

describe('Naive Bruteforce Evaluator', () => {
    it('evaluates N-body interpenetrations O(N^2)', async () => {
        const p1 = new Particle(10, 10, 5, 2, 0);
        const p2 = new Particle(25, 10, 5, -2, 0);

        const engine = new Engine(evaluateNaive);
        engine.width = 100;
        engine.height = 100;
        engine.particles = [p1, p2];

        p1.pos.x = 14; 
        p2.pos.x = 21; 

        await engine.tick();

        expect(p1.vel.x).toBeCloseTo(-2);
        expect(p2.vel.x).toBeCloseTo(2);
    });

    it('resolves Cartesian boundary impacts', async () => {
        const p1 = new Particle(4, 50, 5, -1, 0); 
        const engine = new Engine(evaluateNaive);
        engine.width = 100;
        engine.height = 100;
        engine.particles = [p1];

        await engine.tick();

        expect(p1.pos.x).toEqual(5);
        expect(p1.vel.x).toEqual(1);
    });
});
