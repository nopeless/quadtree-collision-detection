import { describe, it, expect, vi } from 'vitest';
import { Vector2, Particle, updateParticle, collideParticles, Engine } from '../src/javascript/engine';

describe('Vector2 functionality', () => {
    it('creates vector properties', () => {
        const v = new Vector2(3, 4);
        expect(v.x).toBe(3);
        expect(v.y).toBe(4);
    });
});

describe('Particle physics mechanics', () => {
    it('mass is equivalent to radius squared', () => {
        const p = new Particle(0, 0, 5, 0, 0);
        expect(p.mass).toEqual(25);
    });

    it('perfectly elastic head-on collision exchanges velocities', () => {
        const a = new Particle(0, 0, 10, 5, 0);
        const b = new Particle(25, 0, 10, -5, 0);

        updateParticle(a);
        updateParticle(b);

        expect(a.pos.x).toBe(5);
        expect(b.pos.x).toBe(20);

        collideParticles(a, b);

        expect(a.vel.x).toBeCloseTo(-5);
        expect(b.vel.x).toBeCloseTo(5);

        // Ensure positional correction pushed them apart
        expect(b.pos.x - a.pos.x).toBeCloseTo(20); 
    });
});

describe('Engine functionality', () => {
    it('executes dependency injected evaluator correctly', () => {
        const mockProcessor = vi.fn();
        const engine = new Engine(mockProcessor);
        engine.width = 100;
        engine.height = 100;
        engine.particles = [new Particle(0,0,5,0,0)];

        engine.tick();
        expect(mockProcessor).toHaveBeenCalledWith(engine, collideParticles); 

    });
});
