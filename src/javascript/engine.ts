/**
 * Provides mathematical primitives and physics logic for 2D rigid body dynamics.
 * Assumes perfectly elastic collisions ($e = 1$) and mass proportional to $r^2$.
 */

import { QuadTree } from "./quadtree";

/**
 * 2D vector coordinate.
 */
export class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

/**
 * Axis-Aligned Bounding Box (AABB).
 */
export class Rectangle {
  centerX: number;
  centerY: number;
  halfW: number;
  halfH: number;

  constructor(centerX: number, centerY: number, halfW: number, halfH: number) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.halfW = halfW;
    this.halfH = halfH;
  }

  contains(pos: Vector2): boolean {
    return (
      pos.x >= this.centerX - this.halfW &&
      pos.x <= this.centerX + this.halfW &&
      pos.y >= this.centerY - this.halfH &&
      pos.y <= this.centerY + this.halfH
    );
  }

  intersects(range: Rectangle): boolean {
    return !(
      range.centerX - range.halfW > this.centerX + this.halfW ||
      range.centerX + range.halfW < this.centerX - this.halfW ||
      range.centerY - range.halfH > this.centerY + this.halfH ||
      range.centerY + range.halfH < this.centerY - this.halfH
    );
  }
}

/**
 * Rigid circular body.
 */
export class Particle {
  pos: Vector2;
  vel: Vector2;
  radius: number;
  mass: number;
  color: string;

  constructor(x: number, y: number, r: number, vx: number, vy: number, color: string = '#fff') {
    this.pos = new Vector2(x, y);
    this.vel = new Vector2(vx, vy);
    this.radius = r;
    this.mass = r * r; 
    this.color = color;
  }
}

/**
 * Updates spatial coordinates relative to discrete velocity displacements.
 */
export function updateParticle(p: Particle): void {
  p.pos.x += p.vel.x;
  p.pos.y += p.vel.y;
}

/**
 * Evaluates and applies perfectly elastic collision response.
 * Resolves positional interpenetration prior to velocity exchange.
 */
export function collideParticles(
  p1: Particle,
  p2: Particle,
): void {
  // check AABB first
  if (p1.pos.x + p1.radius < p2.pos.x - p2.radius ||
      p1.pos.x - p1.radius > p2.pos.x + p2.radius ||
      p1.pos.y + p1.radius < p2.pos.y - p2.radius ||
      p1.pos.y - p1.radius > p2.pos.y + p2.radius) {
    return;
  }

  const dx = p1.pos.x - p2.pos.x;
  const dy = p1.pos.y - p2.pos.y;

  const dist = Math.hypot(dx, dy);

  // Check for contact
  if (dist >= p1.radius + p2.radius || dist === 0) {
    return; 
  }

  // Structural integrity: Minimum displacement to resolve penetration
  const overlap = p1.radius + p2.radius - dist;
  const nx = dx / dist;
  const ny = dy / dist;

  // Position correction to prevent clipping/sticking (assuming equal pushing)
  const totalMass = p1.mass + p2.mass;
  const correctionRatio1 = p2.mass / totalMass;
  const correctionRatio2 = p1.mass / totalMass;

  p1.pos.x += nx * overlap * correctionRatio1;
  p1.pos.y += ny * overlap * correctionRatio1;
  p2.pos.x -= nx * overlap * correctionRatio2;
  p2.pos.y -= ny * overlap * correctionRatio2;

  // Relative velocity
  const rvx = p1.vel.x - p2.vel.x;
  const rvy = p1.vel.y - p2.vel.y;

  // Velocity along the normal
  const velocityAlongNormal = rvx * nx + rvy * ny;

  // Do not resolve if velocities are separating
  if (velocityAlongNormal > 0) return;

  // Restitution (perfectly elastic: e = 1)
  const e = 1;

  // Impulse magnitude
  const j = -(1 + e) * velocityAlongNormal;
  const impulseScaler = j / (1 / p1.mass + 1 / p2.mass);

  const ix = nx * impulseScaler;
  const iy = ny * impulseScaler;

  // Apply change in velocity
  p1.vel.x += ix / p1.mass;
  p1.vel.y += iy / p1.mass;
  p2.vel.x -= ix / p2.mass;
  p2.vel.y -= iy / p2.mass;
}

/**
 * Applies reflection boundaries to Cartesian coordinate.
 */
export function resolveBoundaries(p: Particle, width: number, height: number): void {
  // Reflect off left/right
  if (p.pos.x - p.radius < 0) {
    p.pos.x = p.radius;
    p.vel.x *= -1;
  } else if (p.pos.x + p.radius > width) {
    p.pos.x = width - p.radius;
    p.vel.x *= -1;
  }

  // Reflect off top/bottom
  if (p.pos.y - p.radius < 0) {
    p.pos.y = p.radius;
    p.vel.y *= -1;
  } else if (p.pos.y + p.radius > height) {
    p.pos.y = height - p.radius;
    p.vel.y *= -1;
  }
}

/**
 * Functional signature for collision evaluation algorithms.
 */
export type CollisionProcessor = (engine: Engine, callback: (p1: Particle, p2: Particle) => void) => void;

/**
 * Execution context for simulation state.
 */
export class Engine {
  particles: Particle[] = [];
  width: number = 0;
  height: number = 0;
  maxRadius: number = 0;
  processor: CollisionProcessor;
  bucketSize: number = 4;
  qtree: QuadTree | null = null;
  dirty = false;

  constructor(processor: CollisionProcessor, particles: Particle[] = [], maxRadius: number = 0) {
    this.processor = processor;
    this.particles = particles;
    this.maxRadius = maxRadius;
  }

  initQuadTree(qtree: any): void {
    this.qtree = qtree;
  }

  drawQuadTree(ctx: CanvasRenderingContext2D): void {
    if (!this.qtree) return;

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ddd';

    // Draw root container
    ctx.rect(
      0.5, 0.5, this.width - 0.5, this.height - 0.5
    )

    const drawLeaf = (tree: QuadTree) => {
      if (!tree.divided) return;

      const x = Math.floor(tree.boundary.centerX - tree.boundary.halfW) + 0.5;
      const y = Math.floor(tree.boundary.centerY - tree.boundary.halfH) + 0.5;
      const w = Math.floor(tree.boundary.halfW * 2) + 0.5;
      const h = Math.floor(tree.boundary.halfH * 2) + 0.5;

      const cx = Math.floor(tree.boundary.centerX) + 0.5;
      const cy = Math.floor(tree.boundary.centerY) + 0.5;

      // Draw middle cross
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(cx, y + h);
      ctx.moveTo(x, cy);
      ctx.lineTo(x + w, cy);
      ctx.stroke();

      drawLeaf(tree.northeast!);
      drawLeaf(tree.northwest!);
      drawLeaf(tree.southeast!);
      drawLeaf(tree.southwest!);
    };

    drawLeaf(this.qtree);
  }

  setProcessor(processor: CollisionProcessor): void {
    this.processor = processor;
  }

  tick() {
    for (const p of this.particles) {
      updateParticle(p);
      resolveBoundaries(p, this.width, this.height);
    }

    this.processor(this, collideParticles);
  }
}

