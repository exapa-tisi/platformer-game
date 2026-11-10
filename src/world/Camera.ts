declare const p5: any;

export default class Camera {
    p: typeof p5;
    pos: any;
    target: any;
    easing: number = 0.2;

    constructor(p: typeof p5, x: number, y: number) {
        this.p = p;
        this.pos = p.createVector(x, y);
        this.target = p.createVector(x, y);
    }

    update(horizontalSpeed: number, verticalSpeed: number) {
        const xEasing = Math.max(this.easing, Math.abs(horizontalSpeed) / (Math.abs(horizontalSpeed) + 100));
        const yEasing = Math.max(this.easing, Math.abs(verticalSpeed) / (Math.abs(verticalSpeed) + 100));
        this.pos.x += (this.target.x - this.pos.x) * xEasing;
        this.pos.y += (this.target.y - this.pos.y) * yEasing;
    }

    setTarget(x: number, y: number) {
        this.target.set(x, y);
    }
}