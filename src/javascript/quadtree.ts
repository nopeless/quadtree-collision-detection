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

  northeast!: null | this;
  northwest!: null | this;
  southeast!: null | this;
  southwest!: null | this;

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

  _insertIntoChildren(p: Particle): boolean {
    /**
     * Short circuiting behavior
     */
    return (
      this.northeast!.insert(p) ||
      this.northwest!.insert(p) ||
      this.southeast!.insert(p) ||
      this.southwest!.insert(p)
    );
  }

  insert(p: Particle): boolean {
    if (!this.boundary.contains(p.pos)) {
      return false;
    }

    if (this.divided) {
      return this._insertIntoChildren(p);
    }

    if (this.particles.length < this.capacity) {
      this.particles.push(p);
      return true;
    }

    this.subdivide();
    return this._insertIntoChildren(p);
  }


  subdivide(): void {
    const cx = this.boundary.centerX;
    const cy = this.boundary.centerY;
    const hw = this.boundary.halfW;
    const hh = this.boundary.halfH;

    const ne = new Rectangle(cx + hw / 2, cy - hh / 2, hw / 2, hh / 2);
    this.northeast = new QuadTree(ne, this.capacity) as this;

    const nw = new Rectangle(cx - hw / 2, cy - hh / 2, hw / 2, hh / 2);
    this.northwest = new QuadTree(nw, this.capacity) as this;

    const se = new Rectangle(cx + hw / 2, cy + hh / 2, hw / 2, hh / 2);
    this.southeast = new QuadTree(se, this.capacity) as this;

    const sw = new Rectangle(cx - hw / 2, cy + hh / 2, hw / 2, hh / 2);
    this.southwest = new QuadTree(sw, this.capacity) as this;

    this.divided = true;

    for (const p of this.particles) {
      if (!this._insertIntoChildren(p)) {
        throw new Error('Failed to insert particle into subdivided quadtree');
      }
    }
    this.particles.length = 0;
  }

  query(range: Rectangle, found: Particle[]): Particle[] {
    if (!this.boundary.intersects(range)) {
      return found;
    }

    if (this.divided) {
      this.northwest!.query(range, found);
      this.northeast!.query(range, found);
      this.southwest!.query(range, found);
      this.southeast!.query(range, found);

      return found;
    }

    for (let i = 0; i < this.particles.length; i++) {
      if (range.contains(this.particles[i].pos)) {
        found.push(this.particles[i]);
      }
    }

    return found;
  }
}

/**
 * Efficient broad-phase collision evaluator utilizing spatial partitioning.
 */
export function processAllCollidingPairs(engine: Engine, callback: (p1: Particle, p2: Particle) => void) {
  const particles = engine.particles;
  if (particles.length === 0) return;

  const centerX = engine.width / 2;
  const centerY = engine.height / 2;
  const halfW = engine.width / 2;
  const halfH = engine.height / 2;

  const boundary = new Rectangle(centerX, centerY, halfW, halfH);

  const qtree = new QuadTree(boundary, engine.capacity);
  engine.initQuadTree(qtree);

  // Build tree from spatial coordinates
  for (let i = 0; i < particles.length; i++) {
    qtree.insert(particles[i]);
  }

  // Broad-phase bounds finding via Quadtree
  const seen = new Set<Particle>();
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    seen.add(p);

    const searchArea = p.radius + engine.maxRadius;
    const range = new Rectangle(p.pos.x, p.pos.y, searchArea, searchArea);
    const candidates = qtree.query(range, []);

    // Narrow-phase scalar elastic processing
    for (let j = 0; j < candidates.length; j++) {
      const other = candidates[j];
      if (!seen.has(other)) {
        callback(p, other);
      }
    }
  }
}
