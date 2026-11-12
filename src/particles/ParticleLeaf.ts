declare const p5: any;

import { assets } from '../util/AssetLoader';
import Particle from './Particle';

export default class ParticleLeaf extends Particle {
    vel: any;
    private randomState: number;
    private readonly fallSpeed: number;
    private windFrom: number;
    private windTo: number;
    private windTime: number;
    private windDuration: number;
    private gustTime: number;
    private gustDuration: number;
    private gustCooldown: number;
    private gustX: number;
    private gustY: number;
    private rotation: number;
    private readonly rotationSpeed: number;
    private spawnY: number;
    inFront: boolean;

    constructor(p: typeof p5, x: number, y: number, size: number, color: any, lifespan = 255) {
        super(p, x, y, size, color, lifespan);
        this.particleImage = assets.particleLeaf;
        this.randomState = Math.floor(p.random(1, 0x7fffffff)) || 1;
        this.spawnY = y;
        this.inFront = false;
        this.fallSpeed = p.random(1.1, 1.6);
        this.windFrom = this.randomBetween(-1.4, 1.4);
        this.windTo = this.randomBetween(-0.9, 0.9);
        this.windTime = 0;
        this.windDuration = this.randomBetween(55, 120);
        this.gustTime = 0;
        this.gustDuration = 0;
        this.gustCooldown = this.randomBetween(50, 150);
        this.gustX = 0;
        this.gustY = 0;
        this.rotation = p.random(p.TWO_PI);
        this.rotationSpeed = p.random(-0.012, 0.012);
        this.vel = p.createVector(0, this.fallSpeed);
    }

    update() {
        if (this.windTime >= this.windDuration) {
            this.windFrom = this.windTo;
            this.windTo = this.randomBetween(-0.45, 0.45);
            this.windTime = 0;
            this.windDuration = this.randomBetween(55, 120);
        }

        const progress = this.windTime / this.windDuration;
        const easedProgress = progress * progress * (3 - 2 * progress);
        const windVelocity = this.windFrom + (this.windTo - this.windFrom) * easedProgress;
        this.windTime++;

        if (this.gustDuration === 0) {
            this.gustCooldown--;
            if (this.gustCooldown <= 0) {
                this.gustTime = 0;
                this.gustDuration = this.randomBetween(7, 16);
                this.gustX = this.randomBetween(-4.5, 4.5);
                this.gustY = this.randomBetween(0, 1) < 0.3
                    ? this.randomBetween(-4.5, -2)
                    : this.randomBetween(-1.5, 2.5);
            }
        }

        let gustStrength = 0;
        if (this.gustDuration > 0) {
            gustStrength = Math.sin(Math.PI * this.gustTime / this.gustDuration);
            this.gustTime++;
            if (this.gustTime >= this.gustDuration) {
                this.gustDuration = 0;
                this.gustCooldown = this.randomBetween(60, 180);
            }
        }

        this.vel.x = windVelocity + this.gustX * gustStrength;
        this.vel.y = this.fallSpeed + this.gustY * gustStrength;
        this.pos.add(this.vel);
        this.rotation += this.rotationSpeed
            + this.vel.x * 0.035
            + this.gustY * gustStrength * 0.015;
    }

    reset(x: number, y: number, inFront: boolean) {
        this.pos.x = x;
        this.pos.y = y;
        this.spawnY = y;
        this.inFront = inFront;
        this.windFrom = this.randomBetween(-1.4, 1.4);
        this.windTo = this.randomBetween(-0.9, 0.9);
        this.windTime = 0;
        this.windDuration = this.randomBetween(55, 120);
    }

    hasFallen(distance: number) {
        return this.pos.y > this.spawnY + distance;
    }

    private randomBetween(min: number, max: number) {
        let value = this.randomState;
        value ^= value << 13;
        value ^= value >>> 17;
        value ^= value << 5;
        this.randomState = value >>> 0;
        return min + (this.randomState / 0x100000000) * (max - min);
    }

    draw(buffer: any) {
        buffer.push();
        buffer.translate(this.pos.x, this.pos.y);
        buffer.rotate(this.rotation);
        buffer.imageMode(buffer.CENTER);
        buffer.image(this.particleImage, 0, 0, this.size, this.size);
        buffer.pop();
    }
}
