# Quadtrees & Collision Detection: An Interactive Demonstration

[video](https://github.com/user-attachments/assets/b6b52d89-c5bc-42d1-b62b-bdbf56dfa54c)

[Live Demo](https://nopeless.github.io/quadtree-collision-detection/)

An algorithmic comparison demonstrator designed for our CSCi Oral Comp presentation. This educational playground compares a naive $O(N^2)$ collision detection algorithm against a spatially optimized QuadTree implementation.

## The Problem: N-Body Collision Detection

In physical simulations, checking every object against every other object (the Brute Force method) yields an $O(n^2)$ complexity. As the number of objects ($n$) grows, the computational cost increases quadratically causing the simulation to lag. 

Our engine utilizes standard 2D elastic vector collision. However, calculating these mathematics for every possible pair becomes a severe bottleneck.

## The Solution: Spatial Partitioning via Quadtrees

To solve the Brute Force bottleneck, this demo uses a Quadtree to spatially partition the 2D plane. 

Instead of looping $N$ times against $N$ items, the Quadtree recursively decomposes the 2D space into four quadrants (NW, NE, SW, SE). 
- **Capacity ($k$):** A node splits into four child regions (Leaf Nodes) once the number of objects exceeds its threshold capacity.
- **Insert & Query:** Objects are inserted into their corresponding spatial nodes. When testing for collisions, we only query objects within the immediate "danger zone" (the relevant bounding box), aggressively ignoring irrelevant subsets.

## Interactive Controls

Use the interface to directly benchmark the algorithms in real-time under changing spatial constraints:

- **Implementation:** Toggle between the baseline $O(n^2)$ approach and the QuadTree optimization.
- **Bucket Size:** Capacity threshold before a QuadTree node dynamically subdivides.
- **Particles:** Modify the active object count.
- **Speed:** Modify speed of particles.
- **Playback & Stepping:** Halt execution and advance the simulation one tick.
- **Performance Metrics:** Real-time Ticks Per Second (TPS) of the simulation.

> To view locally: `npm install` followed by `npm run dev`
