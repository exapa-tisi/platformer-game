declare const p5: any;

import { TILE_SIZE } from '../Levels';

export default class ParticleMove {
    readonly pos: any;
    private readonly vel: any;
    private readonly color: number[];
    private readonly size: number;
    private lifespan: number;

    constructor(
        p: typeof p5,
        x: number,
        y: number,
        color: number[],
        velocityX: number,
        velocityY: number,
    ) {
        this.pos = p.createVector(x, y);
        this.vel = p.createVector(velocityX, velocityY);
        this.color = color;
        this.size = p.random(5, 25);
        this.lifespan = p.random(18, 30);
    }

    update(level: number[][]) {
        this.vel.y += 0.18;
        this.vel.mult(0.96);

        const steps = Math.max(
            1,
            Math.ceil(Math.max(Math.abs(this.vel.x), Math.abs(this.vel.y)) / Math.max(1, this.size / 2)),
        );
        for (let step = 0; step < steps; step++) {
            this.moveAxis(level, this.vel.x / steps, 'x');
            this.moveAxis(level, this.vel.y / steps, 'y');
        }

        this.lifespan -= 1;
    }

    private moveAxis(level: number[][], amount: number, axis: 'x' | 'y') {
        if (amount === 0) {
            return;
        }

        this.pos[axis] += amount;
        const left = Math.floor((this.pos.x + 0.001) / TILE_SIZE);
        const right = Math.floor((this.pos.x + this.size - 0.001) / TILE_SIZE);
        const top = Math.floor((this.pos.y + 0.001) / TILE_SIZE);
        const bottom = Math.floor((this.pos.y + this.size - 0.001) / TILE_SIZE);

        for (let tileY = top; tileY <= bottom; tileY++) {
            for (let tileX = left; tileX <= right; tileX++) {
                if (level[tileY]?.[tileX] !== 1) {
                    continue;
                }

                if (axis === 'x') {
                    this.pos.x = amount > 0
                        ? tileX * TILE_SIZE - this.size
                        : (tileX + 1) * TILE_SIZE;
                    this.vel.x *= -0.35;
                    if (Math.abs(this.vel.x) < 0.25) {
                        this.vel.x = 0;
                    }
                } else {
                    this.pos.y = amount > 0
                        ? tileY * TILE_SIZE - this.size
                        : (tileY + 1) * TILE_SIZE;
                    this.vel.y *= -0.3;
                    if (Math.abs(this.vel.y) < 1) {
                        this.vel.y = 0;
                    }
                }
                return;
            }
        }
    }

    isDead() {
        return this.lifespan <= 0;
    }

    draw(buffer: any) {
        buffer.noStroke();
        buffer.fill(
            this.color[0],
            this.color[1],
            this.color[2],
            this.color[3] * (this.lifespan / 30),
        );
        buffer.rect(this.pos.x, this.pos.y, this.size, this.size);
    }
}