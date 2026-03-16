import { describe, it, expect } from 'vitest';
import { Particle, Engine } from '../src/javascript/engine';
import { processAllCollidingPairs as evaluateNaive } from '../src/javascript/naive';

describe('Naive Bruteforce Evaluator', () => {
    it('evaluates N-body interpenetrations O(N^2)', () => {
        const p1 = new Particle(10, 10, 5, 2, 0); // Moving mostly right
        const p2 = new Particle(25, 10, 5, -2, 0); // Moving left
        
        const engine = new Engine(evaluateNaive);
        engine.width = 100;
        engine.height = 100;
        engine.particles = [p1, p2];

        // Ensure collision state on manual step
        p1.pos.x = 14; 
        p2.pos.x = 21; 
        
        engine.tick();

        // Simulation resolves intersecting boundaries and reflects velocity vectors.
        expect(p1.vel.x).toBeCloseTo(-2);
        expect(p2.vel.x).toBeCloseTo(2);
    });

    it('resolves Cartesian boundary impacts', () => {
        // Will impact left boundary next tick
        const p1 = new Particle(4, 50, 5, -1, 0); 
        const engine = new Engine(evaluateNaive);
        engine.width = 100;
        engine.height = 100;
        engine.particles = [p1];

        engine.tick();

        // Evaluates deterministic displacement mapping onto Cartesian constraints and reflects position.
        expect(p1.pos.x).toEqual(5);
        expect(p1.vel.x).toEqual(1);
    });
});
