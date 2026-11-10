declare const p5: any;

export default class Tile {
    p: typeof p5;
    pos: any;
    size: number;
    tileList: Array<Tile> = [];

    constructor(p: typeof p5, x: number, y: number, size: number) {
        this.p = p;
        this.pos = p.createVector(x, y);
        this.size = size;
    }

    registerTile(tile: Tile) {
        this.tileList.push(tile);
    }

    draw(buffer: any) {
        buffer.rect(this.pos.x, this.pos.y, this.size, this.size);
    }
}