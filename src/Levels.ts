
import Tile from "./world/objects/Tile";

export default class Levels {
    levels: Array<Array<Array<number>>> = [
        [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
            [0, 1, 0, 1, 1, 1, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 1, 1, 1, 0, 1, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ],
    ];

    setLevel(levelIndex: number): Array<Array<number>> {
        if (levelIndex < 0 || levelIndex >= this.levels.length) {
            throw new Error(`Invalid level index: ${levelIndex}`);
        }
        return this.levels[levelIndex];
    }

    drawLevel(buffer: any, levelIndex: number, tileSize: number) {
        const level = this.setLevel(levelIndex);
        for (let y = 0; y < level.length; y++) {
            for (let x = 0; x < level[y].length; x++) {
                if (level[y][x] === 1) {
                    //pull the tile from the tile list and draw it
                    const tile = new Tile(buffer, x * tileSize, y * tileSize, tileSize);
                    tile.draw(buffer);
                }
            }
        }
    }
}