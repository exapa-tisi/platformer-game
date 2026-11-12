declare const p5: any;

export default class Tile {
    private readonly p: typeof p5;
    readonly pos: any;
    readonly size: number;

    constructor(p: typeof p5, x: number, y: number, size: number) {
        this.p = p;
        this.pos = p.createVector(x, y);
        this.size = size;
    }

    draw(buffer: any) {
        buffer.rect(this.pos.x, this.pos.y, this.size, this.size);
    }
}