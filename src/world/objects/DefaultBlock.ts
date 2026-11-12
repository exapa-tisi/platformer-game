declare const p5: any;

import { assets } from '../../util/AssetLoader';
import Tile from './Tile';

export default class DefaultBlock extends Tile {
    constructor(p: typeof p5, x: number, y: number, size: number) {
        super(p, x, y, size);
    }

    draw(buffer: any) {
        if (assets.grass) {
            buffer.image(assets.grass, this.pos.x, this.pos.y, this.size, this.size);
        } else {
            super.draw(buffer);
        }
    }
}