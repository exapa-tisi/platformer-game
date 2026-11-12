declare const p5: any;

import DefaultBlock from "./world/objects/DefaultBlock";
import { assets } from "./util/AssetLoader";
import firstLevel from "./assets/levels/first_test.json";

export const TILE_SIZE = 100;

export const LEVELS: number[][][] = [firstLevel.tiles];

export function getLevelSpawnPosition(levelIndex: number): { x: number; y: number } {
    if (!Levels.isValidIndex(levelIndex)) {
        throw new Error(`Invalid level index: ${levelIndex}`);
    }

    const level = LEVELS[levelIndex];
    const spawnTiles: Array<{ x: number; y: number }> = [];
    for (let y = 0; y < level.length; y++) {
        for (let x = 0; x < level[y].length; x++) {
            if (level[y][x] === 5) {
                spawnTiles.push({ x, y });
            }
        }
    }

    if (spawnTiles.length !== 1) {
        throw new Error(`Level ${levelIndex} must have exactly one spawn tile (5).`);
    }

    return {
        x: spawnTiles[0].x * TILE_SIZE,
        y: spawnTiles[0].y * TILE_SIZE,
    };
}

export default class Levels {
    readonly levelIndex: number;
    private readonly levelImage: any;

    constructor(p: typeof p5, levelIndex = 0, tileSize = TILE_SIZE) {
        if (!Levels.isValidIndex(levelIndex)) {
            throw new Error(`Invalid level index: ${levelIndex}`);
        }

        this.levelIndex = levelIndex;
        const level = LEVELS[levelIndex];
        const levelWidth = Math.max(...level.map(row => row.length));
        this.levelImage = p.createGraphics(levelWidth * tileSize, level.length * tileSize);
        this.levelImage.noSmooth();

        for (let y = 0; y < level.length; y++) {
            for (let x = 0; x < level[y].length; x++) {
                if (level[y][x] !== 1) {
                    continue;
                }

                const tile = new DefaultBlock(p, x * tileSize, y * tileSize, tileSize);
                if (assets.grassFull) {
                    this.levelImage.image(assets.grassFull, tile.pos.x, tile.pos.y, tile.size, tile.size);
                } else {
                    tile.draw(this.levelImage);
                }
            }
        }

        for (let y = 0; y < level.length; y++) {
            for (let x = 0; x < level[y].length; x++) {
                if (level[y][x] !== 1) {
                    continue;
                }

                const tileX = x * tileSize;
                const tileY = y * tileSize;
                if (level[y - 1]?.[x] !== 1 && assets.grassTop) {
                    this.levelImage.image(assets.grassTop, tileX, tileY - tileSize, tileSize, tileSize);
                }
                if (level[y + 1]?.[x] !== 1 && assets.grassBottom) {
                    this.levelImage.image(assets.grassBottom, tileX, tileY + tileSize, tileSize, tileSize);
                }
                //left tile
                if (level[y]?.[x - 1] !== 1 && assets.grassSide) {
                    this.levelImage.image(assets.grassSide, tileX - tileSize, tileY, tileSize, tileSize);
                }
                //right tile
                if (level[y]?.[x + 1] !== 1 && assets.grassSide) {
                    this.levelImage.push();
                    this.levelImage.translate(tileX + tileSize * 2, tileY);
                    this.levelImage.scale(-1, 1);
                    this.levelImage.image(assets.grassSide, 0, 0, tileSize, tileSize);
                    this.levelImage.pop();
                }
            }
        }
    }

    static isValidIndex(levelIndex: unknown): levelIndex is number {
        return typeof levelIndex === "number"
            && Number.isInteger(levelIndex)
            && levelIndex >= 0
            && levelIndex < LEVELS.length;
    }

    draw(buffer: any) {
        buffer.image(this.levelImage, 0, 0);
    }
}
