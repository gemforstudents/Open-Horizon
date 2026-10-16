/**
 * HORIZON: OPEN ROADS - Particle System
 * Pre-allocated particle pool for tire smoke, off-road dirt dust, and drift sparks.
 */

import * as THREE from 'three';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
  alpha: number;
  active: boolean;
  colorR: number;
  colorG: number;
  colorB: number;
}

export class ParticleSystem {
  private maxParticles = 200;
  private pool: Particle[] = [];
  private instMesh: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();

  constructor(scene: THREE.Scene) {
    const geo = new THREE.SphereGeometry(0.35, 6, 5);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });

    this.instMesh = new THREE.InstancedMesh(geo, mat, this.maxParticles);
    this.instMesh.frustumCulled = false;
    scene.add(this.instMesh);

    // Initialize particle pool
    for (let i = 0; i < this.maxParticles; i++) {
      this.pool.push({
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1.0,
        scale: 1.0,
        alpha: 0,
        active: false,
        colorR: 1,
        colorG: 1,
        colorB: 1,
      });

      this.dummy.position.set(0, -100, 0);
      this.dummy.updateMatrix();
      this.instMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.instMesh.instanceMatrix.needsUpdate = true;
  }

  public emit(
    x: number,
    y: number,
    z: number,
    type: 'smoke' | 'dirt' | 'spark' = 'smoke',
    count: number = 2
  ): void {
    let spawned = 0;
    for (let i = 0; i < this.pool.length && spawned < count; i++) {
      const p = this.pool[i];
      if (!p.active) {
        p.active = true;
        p.x = x + (Math.random() - 0.5) * 0.4;
        p.y = y + 0.1;
        p.z = z + (Math.random() - 0.5) * 0.4;
        p.life = 0;

        if (type === 'smoke') {
          p.maxLife = 0.6 + Math.random() * 0.4;
          p.scale = 0.5;
          p.vx = (Math.random() - 0.5) * 1.5;
          p.vy = 1.0 + Math.random() * 1.5;
          p.vz = (Math.random() - 0.5) * 1.5;
          p.colorR = 0.9;
          p.colorG = 0.9;
          p.colorB = 0.95;
        } else if (type === 'dirt') {
          p.maxLife = 0.8 + Math.random() * 0.4;
          p.scale = 0.7;
          p.vx = (Math.random() - 0.5) * 2.5;
          p.vy = 1.5 + Math.random() * 2.0;
          p.vz = (Math.random() - 0.5) * 2.5;
          p.colorR = 0.6;
          p.colorG = 0.45;
          p.colorB = 0.3;
        } else {
          // Orange drift spark
          p.maxLife = 0.3;
          p.scale = 0.3;
          p.vx = (Math.random() - 0.5) * 4.0;
          p.vy = 0.8 + Math.random() * 1.5;
          p.vz = (Math.random() - 0.5) * 4.0;
          p.colorR = 1.0;
          p.colorG = 0.6;
          p.colorB = 0.1;
        }

        spawned++;
      }
    }
  }

  public update(dt: number): void {
    let activeCount = 0;
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (p.active) {
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          this.dummy.position.set(0, -100, 0);
          this.dummy.updateMatrix();
          this.instMesh.setMatrixAt(i, this.dummy.matrix);
          continue;
        }

        const lifeRatio = p.life / p.maxLife;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;

        // Slow down and expand
        p.vx *= 0.95;
        p.vz *= 0.95;
        const currentScale = p.scale * (1.0 + lifeRatio * 2.5);

        this.dummy.position.set(p.x, p.y, p.z);
        this.dummy.scale.set(currentScale, currentScale, currentScale);
        this.dummy.updateMatrix();
        this.instMesh.setMatrixAt(i, this.dummy.matrix);
        activeCount++;
      }
    }

    if (activeCount > 0) {
      this.instMesh.instanceMatrix.needsUpdate = true;
    }
  }

  public cleanup(): void {
    this.instMesh.geometry.dispose();
  }
}
