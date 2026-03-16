import { Particle, Engine, Rectangle } from './engine';

/**
 * Recursive spatial partitioning structure.
 * Organizes regions into bounded quadrants to reduce collision analysis algorithms from $O(n^2)$.
 */
export class QuadTree {
  boundary: Rectangle;
  capacity: number;
  particles: Particle[];
  divided: boolean;

  northeast!: null | QuadTree;
  northwest!: null | QuadTree;
  southeast!: null | QuadTree;
  southwest!: null | QuadTree;

  constructor(boundary: Rectangle, capacity: number) {
    this.boundary = boundary;
    this.capacity = capacity;
    this.particles = [];
    this.divided = false;

    this.northeast = null;
    this.northwest = null;
    this.southeast = null;
    this.southwest = null;
  }

  subdivide(): void {
    const cx = this.boundary.centerX;
    const cy = this.boundary.centerY;
    const hw = this.boundary.halfW / 2;
    const hh = this.boundary.halfH / 2;

    const ne = new Rectangle(cx + hw, cy - hh, hw, hh);
    this.northeast = new QuadTree(ne, this.capacity);

    const nw = new Rectangle(cx - hw, cy - hh, hw, hh);
    this.northwest = new QuadTree(nw, this.capacity);

    const se = new Rectangle(cx + hw, cy + hh, hw, hh);
    this.southeast = new QuadTree(se, this.capacity);

    const sw = new Rectangle(cx - hw, cy + hh, hw, hh);
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

    if (this.northeast!.insert(p)) return true;
    if (this.northwest!.insert(p)) return true;
    if (this.southeast!.insert(p)) return true;
    if (this.southwest!.insert(p)) return true;

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
      this.northwest!.query(range, found);
      this.northeast!.query(range, found);
      this.southwest!.query(range, found);
      this.southeast!.query(range, found);
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

  const centerX = engine.width / 2;
  const centerY = engine.height / 2;
  const halfW = engine.width / 2;
  const halfH = engine.height / 2;

  const boundary = new Rectangle(centerX, centerY, halfW, halfH);

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
        const r = callback(p, other);
        
        if (r instanceof Promise) {
          await r;
        }
      }
    }
  }
}
