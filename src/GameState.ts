declare const p5: any;

import Player from './world/entities/Player';
import Camera from './world/Camera';
import Levels, { getLevelSpawnPosition, LEVELS, TILE_SIZE } from './Levels';
import { assets } from './util/AssetLoader';

type TreeShadingMode = 'background' | 'darken';

const TREE_SHADING_MODE: TreeShadingMode = 'darken';
const TREE_BACKGROUND_COLOR = [255, 255, 120];
const TREE_DARK_COLOR = [35, 35, 35];
const TREE_SPACING = 1;

type SavedState = {
    player: Record<string, unknown>;
    levelIndex: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSerializedVector(value: unknown): value is { x: number; y: number; z?: number } {
    return isRecord(value)
        && typeof value.x === 'number'
        && typeof value.y === 'number'
        && (value.z === undefined || typeof value.z === 'number');
}

export default class GameState {
    private p: typeof p5;
    private class: { player: Player };
    private camera: Camera;
    private currentLevel: Levels;
    private readonly treeLayers: Array<{ size: number; speed: number; phase: number; image: any }>;

    constructor(p5Instance: typeof p5) {
        this.p = p5Instance;
        this.camera = new Camera(this.p, 0, 0);
        this.currentLevel = new Levels(this.p);
        const spawnPosition = getLevelSpawnPosition(this.currentLevel.levelIndex);
        this.class = { player: new Player(this.p, spawnPosition.x, spawnPosition.y) };

        const treeBackground = assets.treeBackground;
        this.treeLayers = treeBackground ? [
            { size: 1000, speed: 0.15, phase: 0.5, image: this.createShadedTree(treeBackground, 0.85) },
            { size: 1500, speed: 0.3, phase: 0.25, image: this.createShadedTree(treeBackground, 0.65) },
            { size: 2000, speed: 0.5, phase: 0, image: this.createShadedTree(treeBackground, 0.4) },
        ] : [];
    }

    private createShadedTree(source: any, amount: number) {
        const target = TREE_SHADING_MODE === 'background'
            ? TREE_BACKGROUND_COLOR
            : TREE_DARK_COLOR;
        const image = this.p.createImage(source.width, source.height);

        source.loadPixels();
        image.loadPixels();
        for (let i = 0; i < source.pixels.length; i += 4) {
            image.pixels[i] = source.pixels[i] + (target[0] - source.pixels[i]) * amount;
            image.pixels[i + 1] = source.pixels[i + 1] + (target[1] - source.pixels[i + 1]) * amount;
            image.pixels[i + 2] = source.pixels[i + 2] + (target[2] - source.pixels[i + 2]) * amount;
            image.pixels[i + 3] = source.pixels[i + 3];
        }
        image.updatePixels();
        return image;
    }

    update() {
        this.class.player.update(this.currentLevel.levelIndex);
    }

    draw(buffer: any, viewportWidth: number, viewportHeight: number) {

        const player = this.class.player;
        const playerCenterX = player.pos.x + player.diameter / 2;
        const playerCenterY = player.pos.y + player.diameter / 2;
        const screenX = playerCenterX + viewportWidth / 2 - this.camera.pos.x;
        const screenY = playerCenterY + viewportHeight / 2 - this.camera.pos.y;
        const edgeMarginX = viewportWidth * 0.25;
        const edgeMarginY = viewportHeight * 0.25;
        let targetX = this.camera.target.x;
        let targetY = this.camera.target.y;

        if (screenX < edgeMarginX) {
            targetX = playerCenterX + viewportWidth / 2 - edgeMarginX;
        } else if (screenX > viewportWidth - edgeMarginX) {
            targetX = playerCenterX + viewportWidth / 2 - (viewportWidth - edgeMarginX);
        }

        if (screenY < edgeMarginY) {
            targetY = playerCenterY + viewportHeight / 2 - edgeMarginY;
        } else if (screenY > viewportHeight - edgeMarginY) {
            targetY = playerCenterY + viewportHeight / 2 - (viewportHeight - edgeMarginY);
        }

        this.camera.setTarget(targetX, targetY);
        //update the camera position
        this.camera.update(player.vel.x, player.vel.y);

        if (this.treeLayers.length > 0) {
            const level = LEVELS[this.currentLevel.levelIndex];
            const groundY = buffer.height + (level.length - 1) * TILE_SIZE - this.camera.pos.y;

            for (const layer of this.treeLayers) {
                const spacing = layer.size * TREE_SPACING;
                const offset = ((-this.camera.pos.x * layer.speed + spacing * layer.phase) % spacing + spacing) % spacing;
                const treeY = groundY - layer.size;

                // Loop strictly across buffer.width, starting one spacing interval left
                for (let x = offset - spacing; x < buffer.width + spacing; x += spacing) {
                    buffer.image(layer.image, x, treeY, layer.size, layer.size);
                }
            }

        }

        //translate the buffer to the camera position
        buffer.translate(
            viewportWidth / 2 - this.camera.pos.x,
            viewportHeight / 2 - this.camera.pos.y,
        );

        this.currentLevel.draw(buffer);
        buffer.fill(255, 255, 255);
        this.class.player.draw(buffer);
    }
    
    save() {
        const player = this.class.player;
        const playerState: Record<string, unknown> = {};

        for (const key of player.saveState) {
            if (!Object.prototype.hasOwnProperty.call(player, key)) {
                throw new Error(`Cannot save unknown player property "${key}".`);
            }

            playerState[key] = player[key];
        }

        const state: SavedState = {
            player: playerState,
            levelIndex: this.currentLevel.levelIndex,
        };
        localStorage.setItem('gameState', JSON.stringify(state));
    }

    load() {
        const savedState = localStorage.getItem('gameState');
        if (savedState === null) {
            return;
        }

        const parsedState: unknown = JSON.parse(savedState);
        if (!isRecord(parsedState) || !isRecord(parsedState.player)) {
            throw new Error('Saved game state has an invalid format.');
        }

        if (parsedState.levelIndex !== undefined && !Levels.isValidIndex(parsedState.levelIndex)) {
            throw new Error('Saved game state has an invalid level index.');
        }

        const player = this.class.player;
        for (const key of player.saveState) {
            if (!Object.prototype.hasOwnProperty.call(player, key)) {
                throw new Error(`Cannot load unknown player property "${key}".`);
            }

            if (!Object.prototype.hasOwnProperty.call(parsedState.player, key)) {
                continue;
            }

            const savedValue = parsedState.player[key];
            const currentValue = player[key];

            if (isRecord(currentValue) && typeof currentValue.add === 'function') {
                if (!isSerializedVector(savedValue)) {
                    throw new Error(`Saved player property "${key}" is not a valid vector.`);
                }

                Object.assign(player, {
                    [key]: this.p.createVector(savedValue.x, savedValue.y, savedValue.z ?? 0),
                });
            } else {
                Object.assign(player, { [key]: savedValue });
            }
        }

        if (parsedState.levelIndex !== undefined) {
            this.setLevel(parsedState.levelIndex);
        }
    }

    setLevel(levelIndex: number) {
        this.currentLevel = new Levels(this.p, levelIndex);
        const spawnPosition = getLevelSpawnPosition(levelIndex);
        this.class.player.resetToSpawn(spawnPosition.x, spawnPosition.y);
    }
}