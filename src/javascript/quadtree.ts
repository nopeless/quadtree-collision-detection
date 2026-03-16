import { Particle, Engine } from './engine';

/**
 * Axis-Aligned Bounding Box (AABB).
 */
export class Rectangle {
  x: number;
  y: number;
  w: number;
  h: number;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  contains(p: Particle): boolean {
    return (
      p.pos.x >= this.x - this.w &&
      p.pos.x <= this.x + this.w &&
      p.pos.y >= this.y - this.h &&
      p.pos.y <= this.y + this.h
    );
  }

  intersects(range: Rectangle): boolean {
    return !(
      range.x - range.w > this.x + this.w ||
      range.x + range.w < this.x - this.w ||
      range.y - range.h > this.y + this.h ||
      range.y + range.h < this.y - this.h
    );
  }
}

/**
 * Recursive spatial partitioning structure.
 * Organizes regions into bounded quadrants to reduce collision analysis algorithms from $O(n^2)$.
 */
export class QuadTree {
  boundary: Rectangle;
  capacity: number;
  particles: Particle[];
  divided: boolean;

  northeast!: QuadTree;
  northwest!: QuadTree;
  southeast!: QuadTree;
  southwest!: QuadTree;

  constructor(boundary: Rectangle, capacity: number) {
    this.boundary = boundary;
    this.capacity = capacity;
    this.particles = [];
    this.divided = false;
  }

  subdivide(): void {
    const x = this.boundary.x;
    const y = this.boundary.y;
    const w = this.boundary.w / 2;
    const h = this.boundary.h / 2;

    const ne = new Rectangle(x + w, y - h, w, h);
    this.northeast = new QuadTree(ne, this.capacity);

    const nw = new Rectangle(x - w, y - h, w, h);
    this.northwest = new QuadTree(nw, this.capacity);

    const se = new Rectangle(x + w, y + h, w, h);
    this.southeast = new QuadTree(se, this.capacity);

    const sw = new Rectangle(x - w, y + h, w, h);
    this.southwest = new QuadTree(sw, this.capacity);

    this.divided = true;

    for (const p of this.particles) {
      if (
        this.northeast.insert(p) ||
        this.northwest.insert(p) ||
        this.southeast.insert(p) ||
        this.southwest.insert(p)
      ) {
        // Successfully inserted
      }
    }
    this.particles = [];
  }

  insert(p: Particle): boolean {
    if (!this.boundary.contains(p)) {
      return false;
    }

    if (!this.divided) {
      if (this.particles.length < this.capacity) {
        this.particles.push(p);
        return true;
      }
      this.subdivide();
    }

    if (this.northeast.insert(p)) return true;
    if (this.northwest.insert(p)) return true;
    if (this.southeast.insert(p)) return true;
    if (this.southwest.insert(p)) return true;

    return false;
  }

  query(range: Rectangle, found: Particle[]): Particle[] {
    if (!this.boundary.intersects(range)) {
      return found;
    }

    for (const p of this.particles) {
      if (range.contains(p)) {
        found.push(p);
      }
    }

    if (this.divided) {
      this.northwest.query(range, found);
      this.northeast.query(range, found);
      this.southwest.query(range, found);
      this.southeast.query(range, found);
    }

    return found;
  }
}

/**
 * Efficient broad-phase collision evaluator utilizing spatial partitioning.
 */
export async function processAllCollidingPairs(engine: Engine, callback: (p1: Particle, p2: Particle) => void | Promise<void>): Promise<void> {
  const particles = engine.particles;
  if (particles.length === 0) return;

  const cx = engine.width / 2;
  const cy = engine.height / 2;
  const w = engine.width / 2;
  const h = engine.height / 2;

  const boundary = new Rectangle(cx, cy, w, h);
  const qtree = new QuadTree(boundary, engine.bucketSize || 4);
  engine.initQuadTree(qtree);

  // Build tree from spatial coordinates
  for (const p of particles) {
    qtree.insert(p);
  }

  // Broad-phase bounds finding via Quadtree
  for (const p of particles) {
    const searchArea = p.radius + engine.maxRadius;
    const range = new Rectangle(p.pos.x, p.pos.y, searchArea, searchArea);
    const candidates = qtree.query(range, []);

    // Narrow-phase scalar elastic processing
    for (const other of candidates) {
      if (p !== other) {
        await callback(p, other);
      }
    }
  }
}
