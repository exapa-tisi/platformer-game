declare const p5: any;

export default class Particle {
    private readonly p: typeof p5;
    pos: any;
    vel: any;
    size: number;
    color: any;
    lifespan: number;
    origin: any;
    span: any;
    spanRotation: number;
    particleImage: any;

    constructor(p: typeof p5, x: number, y: number, size: number, color: any, lifespan = 255) {
        this.p = p;
        this.pos = p.createVector(x, y);
        this.vel = p.createVector(p.random(-1, 1), p.random(-1, 1));
        this.origin = p.createVector(x, y);
        this.span = p.createVector(p.random(-50, 50), p.random(-50, 50));
        this.size = size;
        this.color = color;
        this.lifespan = lifespan;
        this.spanRotation = p.random(p.TWO_PI);
    }

    update() {
        this.pos.add(this.vel);
        this.lifespan -= 2; // Decrease lifespan
        this.spanRotation += 0.05; // Increment the rotation angle
        // Update the position based on the span and rotation
        this.pos.x = this.origin.x + this.span.x * Math.cos(this.spanRotation);
        this.pos.y = this.origin.y + this.span.y * Math.sin(this.spanRotation);
    }

    isDead() {
        return this.lifespan <= 0;
    }

    draw(buffer: any) {
        buffer.noStroke();
        buffer.fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.lifespan);
        buffer.ellipse(this.pos.x, this.pos.y, this.size);
    }
}