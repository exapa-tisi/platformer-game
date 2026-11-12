declare const p5: any;

import Player from './world/entities/Player';
import Camera from './world/Camera';
import Levels, { getLevelSpawnPosition, LEVELS, TILE_SIZE } from './Levels';
import { assets } from './util/AssetLoader';
import ParticleLeaf from './particles/ParticleLeaf';
import ParticleMove from './particles/ParticleMove';

type TreeShadingMode = 'background' | 'darken';

const TREE_SHADING_MODE: TreeShadingMode = 'darken';
const TREE_BACKGROUND_COLOR = [255, 255, 120];
const TREE_DARK_COLOR = [35, 35, 35];
const TREE_SPACING = 1;
const LEAF_PARTICLE_COUNT = 8;
const VIRTUAL_WIDTH = 1920;
const VIRTUAL_HEIGHT = 1080;

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
    private readonly leafParticles: ParticleLeaf[];
    private readonly moveParticles: ParticleMove[] = [];
    private moveParticleTimer = 0;

    constructor(p5Instance: typeof p5) {
        this.p = p5Instance;
        this.camera = new Camera(this.p, 0, 0);
        this.currentLevel = new Levels(this.p);
        const spawnPosition = getLevelSpawnPosition(this.currentLevel.levelIndex);
        this.class = { player: new Player(this.p, spawnPosition.x, spawnPosition.y) };
        this.leafParticles = Array.from({ length: LEAF_PARTICLE_COUNT }, () => {
            const size = this.p.random(22, 36);
            return new ParticleLeaf(
                this.p,
                this.camera.pos.x + this.p.random(-VIRTUAL_WIDTH / 2, VIRTUAL_WIDTH / 2),
                this.camera.pos.y - VIRTUAL_HEIGHT / 2 - this.p.random(0, VIRTUAL_HEIGHT * 0.12),
                size,
                this.p.color(255),
            );
        });

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
        const player = this.class.player;
        const wasTouchingGround = player.touchingGround;
        const level = LEVELS[this.currentLevel.levelIndex];
        const takeoffColor = wasTouchingGround
            ? this.getMovementParticleColor(level, player.pos.x + player.diameter / 2, player.pos.y + player.diameter + 1)
            : null;
        player.update(this.currentLevel.levelIndex);
        for (const leaf of this.leafParticles) {
            leaf.update();
        }

        for (const particle of this.moveParticles) {
            particle.update(level);
        }
        for (let i = this.moveParticles.length - 1; i >= 0; i--) {
            if (this.moveParticles[i].isDead()) {
                this.moveParticles.splice(i, 1);
            }
        }

        if (wasTouchingGround && !player.touchingGround && player.vel.y < 0 && takeoffColor) {
            this.spawnMovementBurst(
                takeoffColor,
                player.pos.x + player.diameter / 2,
                player.pos.y + player.diameter - 30,
                9,
                3,
                5,
            );
        } else if (!wasTouchingGround && player.touchingGround) {
            const landingColor = this.getMovementParticleColor(
                level,
                player.pos.x + player.diameter / 2,
                player.pos.y + player.diameter + 1,
            );
            if (landingColor) {
                this.spawnMovementBurst(
                    landingColor,
                    player.pos.x + player.diameter / 2,
                    player.pos.y + player.diameter - 30,
                    14,
                    5,
                    4,
                );
            }
        }

        if (player.touchingGround && Math.abs(player.vel.x) > 2) {
            const color = this.getMovementParticleColor(
                level,
                player.pos.x + player.diameter / 2,
                player.pos.y + player.diameter + 1,
            );
            if (color) {
                this.moveParticleTimer += this.p.deltaTime / 1000;
                if (this.moveParticleTimer >= 0.07) {
                    const direction = Math.sign(player.vel.x);
                    const spawnX = player.pos.x + (direction > 0 ? player.diameter * 0.3 : player.diameter * 0.7);
                    this.moveParticles.push(new ParticleMove(
                        this.p,
                        spawnX,
                        player.pos.y + player.diameter - 30,
                        color,
                        -direction * this.p.random(1.5, 4),
                        this.p.random(-3.5, -1.5),
                    ));
                    this.moveParticleTimer = 0;
                }
            }
        } else {
            this.moveParticleTimer = 0;
        }

        if (player.pos.y >= level.length * TILE_SIZE) {
            player.kill();
        }
    }

    private getMovementParticleColor(level: number[][], worldX: number, worldY: number): number[] | null {
        const tileX = Math.floor(worldX / TILE_SIZE);
        const tileY = Math.floor(worldY / TILE_SIZE);
        if (level[tileY]?.[tileX] !== 1) {
            return null;
        }

        const tileImage = assets.grassFull;
        if (!tileImage) {
            throw new Error('Grass tile image has not been loaded.');
        }

        return tileImage.get(
            Math.floor(tileImage.width / 2),
            Math.floor(tileImage.height / 2),
        );
    }

    private spawnMovementBurst(
        color: number[],
        x: number,
        y: number,
        count: number,
        horizontalSpeed: number,
        upwardSpeed: number,
    ) {
        for (let i = 0; i < count; i++) {
            this.moveParticles.push(new ParticleMove(
                this.p,
                x + this.p.random(-12, 12),
                y,
                color,
                this.p.random(-horizontalSpeed, horizontalSpeed),
                this.p.random(-upwardSpeed, -upwardSpeed * 0.35),
            ));
        }
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

        const level = LEVELS[this.currentLevel.levelIndex];
        const mapWidth = Math.max(...level.map(row => row.length)) * TILE_SIZE;
        const mapHeight = level.length * TILE_SIZE;
        const halfViewportWidth = viewportWidth / 2;
        const minCameraX = Math.min(halfViewportWidth, mapWidth / 2);
        const maxCameraX = Math.max(mapWidth - halfViewportWidth, mapWidth / 2);
        const maxCameraY = mapHeight - viewportHeight / 2;

        targetX = this.p.constrain(targetX, minCameraX, maxCameraX);
        targetY = Math.min(targetY, maxCameraY);
        this.camera.setTarget(targetX, targetY);
        //update the camera position
        this.camera.update(player.vel.x, player.vel.y);
        this.camera.pos.x = this.p.constrain(this.camera.pos.x, minCameraX, maxCameraX);
        this.camera.pos.y = Math.min(this.camera.pos.y, maxCameraY);

        for (const leaf of this.leafParticles) {
            if (leaf.hasFallen(VIRTUAL_HEIGHT + leaf.size)) {
                leaf.reset(
                    this.camera.pos.x + this.p.random(-viewportWidth / 2, viewportWidth / 2),
                    this.camera.pos.y - viewportHeight / 2 - leaf.size,
                    false,
                );
            }
        }

        if (this.treeLayers.length > 0) {
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

        buffer.push();
        buffer.translate(
            viewportWidth / 2 - this.camera.pos.x,
            viewportHeight / 2 - this.camera.pos.y,
        );

        for (const leaf of this.leafParticles) {
            if (!leaf.inFront) {
                leaf.draw(buffer);
            }
        }

        this.currentLevel.draw(buffer);

        for (const particle of this.moveParticles) {
            particle.draw(buffer);
        }

        for (const leaf of this.leafParticles) {
            if (leaf.inFront) {
                leaf.draw(buffer);
            }
        }

        buffer.fill(255, 255, 255);
        this.class.player.draw(buffer);
        buffer.pop();
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

        if (parsedState.levelIndex !== undefined) {
            this.setLevel(parsedState.levelIndex);
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

    }

    setLevel(levelIndex: number) {
        this.currentLevel = new Levels(this.p, levelIndex);
        const spawnPosition = getLevelSpawnPosition(levelIndex);
        this.class.player.resetToSpawn(spawnPosition.x, spawnPosition.y);
    }
}