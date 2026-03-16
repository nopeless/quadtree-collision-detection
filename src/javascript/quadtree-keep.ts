import { Particle, Engine, Rectangle } from './engine';
import { QuadTree } from './quadtree';

/**
 * Persistent QuadTree that maintains structure across frames.
 * Updates particle positions dynamically instead of rebuilding from scratch.
 */
export class QuadTreeKeep extends QuadTree {
  constructor(boundary: Rectangle, capacity: number) {
    super(boundary, capacity);
  }

  subdivide(): void {
    const cx = this.boundary.centerX;
    const cy = this.boundary.centerY;
    const hw = this.boundary.halfW / 2;
    const hh = this.boundary.halfH / 2;

    this.northeast = new QuadTreeKeep(new Rectangle(cx + hw, cy - hh, hw, hh), this.capacity) as this;
    this.northwest = new QuadTreeKeep(new Rectangle(cx - hw, cy - hh, hw, hh), this.capacity) as this;
    this.southeast = new QuadTreeKeep(new Rectangle(cx + hw, cy + hh, hw, hh), this.capacity) as this;
    this.southwest = new QuadTreeKeep(new Rectangle(cx - hw, cy + hh, hw, hh), this.capacity) as this;

    this.divided = true;

    for (const p of this.particles) {
      this._insertIntoChildren(p);
    }
    this.particles = [];
  }

  /**
   * Updates the tree by extracting particles that moved out of their bounding regions,
   * then reinserting them back up at the root.
   */
  update(root: QuadTreeKeep): void {
    const movedParticles: Particle[] = [];
    this._collectMoved(movedParticles);
    
    for (const p of movedParticles) {
      root.insert(p);
    }
  }

  private _collectMoved(moved: Particle[]): void {
    if (this.divided) {
      this.northeast!._collectMoved(moved);
      this.northwest!._collectMoved(moved);
      this.southeast!._collectMoved(moved);
      this.southwest!._collectMoved(moved);

      // Attempt to collapse branches if they're sparsely populated
      const totalCount = this.count();
      if (totalCount <= this.capacity) {
        this._collapse();
      }
    } else {
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];

        if (!this.boundary.contains(p)) {
          moved.push(p);

          const last = this.particles.pop()!;
          if (last !== p) this.particles[i--] = last;
        }
      }
    }
  }

  private _collapse(): void {
    const allParticles: Particle[] = [];
    this._getAllParticles(allParticles);
    this.particles = allParticles;
    this.divided = false;
    
    // Clear out children to allow garbage collection
    this.northeast = null;
    this.northwest = null;
    this.southeast = null;
    this.southwest = null;
  }

  private _getAllParticles(out: Particle[]): void {
    if (this.divided) {
      this.northeast!._getAllParticles(out);
      this.northwest!._getAllParticles(out);
      this.southeast!._getAllParticles(out);
      this.southwest!._getAllParticles(out);
    } else {
      out.push(...this.particles);
    }
  }

  count(): number {
    if (this.divided) {
      return this.northeast!.count() + this.northwest!.count() + 
             this.southeast!.count() + this.southwest!.count();
    }
    return this.particles.length;
  }
}

let persistentTree: QuadTreeKeep | null = null;

/**
 * Efficient broad-phase collision evaluator using a persistent spatial partition structure.
 */
export async function processAllCollidingPairsKeep(engine: Engine, callback: (p1: Particle, p2: Particle) => void | Promise<void>): Promise<void> {
  const particles = engine.particles;
  if (particles.length === 0) return;

  const centerX = engine.width / 2;
  const centerY = engine.height / 2;
  const halfW = engine.width / 2;
  const halfH = engine.height / 2;

  if (!persistentTree || persistentTree.boundary.halfW !== halfW || persistentTree.boundary.halfH !== halfH) {
    const boundary = new Rectangle(centerX, centerY, halfW, halfH);
    persistentTree = new QuadTreeKeep(boundary, engine.bucketSize || 4);
    
    for (const p of particles) {
      persistentTree.insert(p);
    }
  } else {
    // Fast path: simply update the existing tree structure
    persistentTree.update(persistentTree);
  }

  engine.initQuadTree(persistentTree as any);

  // Broad-phase bounds finding via Quadtree
  for (const p of particles) {
    const searchArea = p.radius + engine.maxRadius;
    const range = new Rectangle(p.pos.x, p.pos.y, searchArea, searchArea);
    const candidates = persistentTree.query(range, []);

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
