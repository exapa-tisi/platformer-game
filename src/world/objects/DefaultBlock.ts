declare const p5: any;

import { assets } from '../../util/AssetLoader';
import Tile from './Tile';

//will eventually add dynamic tile assets, like for corners and stuff

export default class DefaultBlock extends Tile {

    constructor(p: typeof p5, x: number, y: number, size: number) {
        super(p, x, y, size);

        this.registerTile(this);
    }

    draw(buffer: any) {
        buffer.image(assets['grass'], this.pos.x, this.pos.y, this.size, this.size);
    }
}