import { describe, it, expect } from 'vitest';
import { Particle, Engine } from '../src/javascript/engine';
import { QuadTree, Rectangle, processAllCollidingPairs as evaluateQuadtree } from '../src/javascript/quadtree';

describe('QuadTree structural logic', () => {
    it('creates tree bounds and stores particles within capacity', () => {
        const bounds = new Rectangle(50, 50, 50, 50); // Entire 100x100 space
        const qt = new QuadTree(bounds, 4);

        const p1 = new Particle(10, 10, 5, 0, 0);
        expect(qt.insert(p1)).toBe(true);
        expect(qt.particles.length).toBe(1);
    });

    it('subdivides upon exceeding capacity', () => {
        const bounds = new Rectangle(50, 50, 50, 50); // Entire 100x100 space
        const qt = new QuadTree(bounds, 4);

        for(let i=0; i<4; i++) {
            qt.insert(new Particle(10+i, 10+i, 2, 0, 0));
        }

        expect(qt.divided).toBe(false);
        // Exceed capacity
        qt.insert(new Particle(20, 20, 2, 0, 0));
        expect(qt.divided).toBe(true);
        expect(qt.northwest).toBeDefined();
    });

    it('spatial query retrieves subsets accurately', () => {
        const bounds = new Rectangle(50, 50, 50, 50);
        const qt = new QuadTree(bounds, 4);

        const p1 = new Particle(10, 10, 5, 0, 0); // NW quadrant
        const p2 = new Particle(90, 90, 5, 0, 0); // SE quadrant
        qt.insert(p1);
        qt.insert(p2);

        // Query NW 
        const testRange = new Rectangle(25, 25, 25, 25);
        const results = qt.query(testRange, []);

        expect(results.length).toBe(1);
        expect(results[0]).toBe(p1);
    });
});

describe('QuadTree Evaluator Physics Processing', () => {
    it('evaluates and resolves bounds using Broad + Narrow phase correctly', async () => {
        const p1 = new Particle(10, 10, 5, 2, 0); // Moving mostly right
        const p2 = new Particle(25, 10, 5, -2, 0); // Moving left

        const engine = new Engine(evaluateQuadtree);
        engine.width = 100;
        engine.height = 100;
        engine.maxRadius = 5;
        engine.particles = [p1, p2];

        // Ensure collision state on manual step
        p1.pos.x = 12;
        p2.pos.x = 23;

        await engine.tick();

        // Simulation step calculates discrete position displacement and resolves resulting boundaries.
        expect(p1.vel.x).toBeCloseTo(-2);
        expect(p2.vel.x).toBeCloseTo(2);
    });
});
