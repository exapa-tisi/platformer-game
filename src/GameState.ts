declare const p5: any;

import Player from './world/entities/Player';
import Camera from './world/Camera';

type SavedState = {
    player: Record<string, unknown>;
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

    constructor(p5Instance: typeof p5) {
        this.p = p5Instance;
        this.class = { player: new Player(this.p, 100, 100) };
        this.camera = new Camera(this.p, 0, 0);

    }

    update() {
        this.class.player.update();
    }

    draw(buffer: any, viewportWidth: number, viewportHeight: number) {

        const player = this.class.player;
        const playerCenterX = player.pos.x + player.squareSize / 2;
        const playerCenterY = player.pos.y + player.squareSize / 2;
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

        //translate the buffer to the camera position
        buffer.translate(
            viewportWidth / 2 - this.camera.pos.x,
            viewportHeight / 2 - this.camera.pos.y,
        );

        //draw the player

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

        const state: SavedState = { player: playerState };
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
}