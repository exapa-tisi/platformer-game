declare const p5: any;

import {gravity} from '../WorldEnvronment';
import {LEVELS, TILE_SIZE} from '../../Levels';
import {assets} from '../../util/AssetLoader';

export default class Player {
    p: typeof p5;
    pos: any;
    vel: any;
    touchingGround: boolean = false;
    jumpStrength: number = 15;
    coyoteTime: number = 0.1;
    private coyoteTimeRemaining: number = 0;

    termVelocity: number = 10;
    walkSpeed: number = 10;

    currentAmt: number = 0;
    groundAmt: number = 0.3;
    airAmt: number = 0.1;
    groundFriction: number = 0.06;
    overspeedGracePeriod: number = 0.2;
    overspeedDecayRate: number = 8;
    overspeedDuration: number = 0;

    dashState: boolean = false;
    canDash: boolean = true;
    dashSpeed: number = 50;

    diameter: number = 100;
    rollAngle: number = 0;
    private readonly radius: number = this.diameter / 2;

    saveState: Array<keyof Player>;

    constructor(p: typeof p5, x: number, y: number) {
        this.p = p;
        this.pos = p.createVector(x, y);
        this.vel = p.createVector(0, 0);

        //this is so if I want to apply images to the player it doesnt save to local storage
        this.saveState = ["pos", "vel", "touchingGround", "rollAngle"];
    }

    resetToSpawn(x: number, y: number) {
        this.pos = this.p.createVector(x, y);
        this.vel = this.p.createVector(0, 0);
        this.touchingGround = false;
        this.coyoteTimeRemaining = 0;
    }

    update(levelIndex = 0) {
        const deltaSeconds = this.p.deltaTime / 1000;
        if (this.touchingGround) {
            this.coyoteTimeRemaining = this.coyoteTime;
        } else {
            this.coyoteTimeRemaining = Math.max(0, this.coyoteTimeRemaining - deltaSeconds);
        }

        // Update position based on velocity

        //temporarily add a dash function to test velocity logic

        if (this.p.keyIsDown(this.p.SHIFT) && this.dashState === false && this.canDash) {
            //throw player in the direction they are moving
            if (this.p.keyIsDown(this.p.LEFT_ARROW)) {
                this.vel.x = -this.dashSpeed;
            } else if (this.p.keyIsDown(this.p.RIGHT_ARROW)) {
                this.vel.x = this.dashSpeed;
            }

            if (this.p.keyIsDown(this.p.UP_ARROW)) {
                this.vel.y = -this.dashSpeed;
            }
            if (this.p.keyIsDown(this.p.DOWN_ARROW)) {
                this.vel.y = this.dashSpeed;
            }
            this.vel.y += gravity; // Apply gravity during dash
            this.canDash = false; // prec=vent dashing untill the touch the ground next
            this.dashState = true;
        }
        if (!this.p.keyIsDown(this.p.SHIFT)) {
            this.dashState = false;
        }

        //slowdown/speedup the player to walkspeed instead of just setting it to ad some advanced tecs
        if (this.touchingGround) {
            this.currentAmt = this.groundAmt;
            this.canDash = true; //reset dash when touching the ground
        } else {
            this.currentAmt = this.airAmt;
        }
        const horizontalInput = this.p.keyIsDown(this.p.LEFT_ARROW)
            ? -1
            : this.p.keyIsDown(this.p.RIGHT_ARROW)
                ? 1
                : 0;
        if (Math.abs(this.vel.x) > this.walkSpeed) {
            this.overspeedDuration += deltaSeconds;
        } else {
            this.overspeedDuration = 0;
        }

        if (horizontalInput !== 0) {
            const isOverspeedInInputDirection = this.vel.x * horizontalInput > this.walkSpeed;
            if (isOverspeedInInputDirection) {
                if (this.overspeedDuration > this.overspeedGracePeriod) {
                    const excessSpeed = Math.abs(this.vel.x) - this.walkSpeed;
                    const decay = Math.exp(-this.overspeedDecayRate * deltaSeconds);
                    this.vel.x = horizontalInput * (this.walkSpeed + excessSpeed * decay);
                }
            } else {
                this.vel.x = this.p.lerp(
                    this.vel.x,
                    horizontalInput * this.walkSpeed,
                    this.currentAmt,
                );
            }
        } else {
            const friction = this.touchingGround ? this.groundFriction : this.airAmt;
            this.vel.x = this.p.lerp(this.vel.x, 0, friction);
        }

        if (this.p.keyIsDown(this.p.UP_ARROW) && (this.touchingGround || this.coyoteTimeRemaining > 0)) {
            this.vel.y = -this.jumpStrength; // Jump if touching the ground
            this.coyoteTimeRemaining = 0;
        }

        this.vel.y += gravity;

        //deaccel the player if they are moving faster than the term velocity
        if (this.vel.y > this.termVelocity) {
            this.vel.y = this.p.lerp(this.vel.y, this.termVelocity, 0.1);
        }

        const currentLevelArray = LEVELS[levelIndex];
        if (!currentLevelArray) {
            throw new Error(`Invalid level index for player collision: ${levelIndex}`);
        }

        this.touchingGround = false;
        const previousX = this.pos.x;
        const maxStep = this.radius / 2;
        const substeps = Math.max(
            1,
            Math.ceil(Math.max(Math.abs(this.vel.x), Math.abs(this.vel.y)) / maxStep),
        );

        for (let step = 0; step < substeps; step++) {
            this.pos.x += this.vel.x / substeps;
            this.pos.y += this.vel.y / substeps;
            this.resolveTileCollisions(currentLevelArray);
        }

        this.rollAngle += (this.pos.x - previousX) / this.radius;
    }

    private resolveTileCollisions(level: number[][]) {
        const firstColumn = Math.max(0, Math.floor(this.pos.x / TILE_SIZE));
        const lastColumn = Math.floor((this.pos.x + this.diameter) / TILE_SIZE);
        const firstRow = Math.max(0, Math.floor(this.pos.y / TILE_SIZE));
        const lastRow = Math.min(
            level.length - 1,
            Math.floor((this.pos.y + this.diameter) / TILE_SIZE),
        );

        for (let pass = 0; pass < 4; pass++) {
            let resolvedCollision = false;
            for (let y = firstRow; y <= lastRow; y++) {
                for (let x = firstColumn; x <= lastColumn; x++) {
                    if (level[y]?.[x] !== 1) {
                        continue;
                    }

                    const tileX = x * TILE_SIZE;
                    const tileY = y * TILE_SIZE;
                    const centerX = this.pos.x + this.radius;
                    const centerY = this.pos.y + this.radius;
                    const closestX = Math.max(tileX, Math.min(centerX, tileX + TILE_SIZE));
                    const closestY = Math.max(tileY, Math.min(centerY, tileY + TILE_SIZE));
                    const offsetX = centerX - closestX;
                    const offsetY = centerY - closestY;
                    const distanceSquared = offsetX ** 2 + offsetY ** 2;
                    if (distanceSquared >= this.radius ** 2) {
                        continue;
                    }

                    let normalX: number;
                    let normalY: number;
                    let penetration: number;
                    if (distanceSquared > 0) {
                        const distance = Math.sqrt(distanceSquared);
                        normalX = offsetX / distance;
                        normalY = offsetY / distance;
                        penetration = this.radius - distance;
                    } else {
                        const faces = [
                            { distance: centerX - tileX, x: -1, y: 0 },
                            { distance: tileX + TILE_SIZE - centerX, x: 1, y: 0 },
                            { distance: centerY - tileY, x: 0, y: -1 },
                            { distance: tileY + TILE_SIZE - centerY, x: 0, y: 1 },
                        ];
                        const nearestFace = faces.reduce((nearest, face) =>
                            face.distance < nearest.distance ? face : nearest,
                        );
                        normalX = nearestFace.x;
                        normalY = nearestFace.y;
                        penetration = this.radius + nearestFace.distance;
                    }

                    if (this.vel.y < 0 && normalY > 0 && normalX === 0) {
                        normalX = 0;
                        normalY = 1;
                        penetration = tileY + TILE_SIZE + this.radius - centerY;
                    }

                    this.pos.x += normalX * (penetration + 0.001);
                    this.pos.y += normalY * (penetration + 0.001);
                    if (normalY < -0.5) {
                        this.touchingGround = true;
                    }

                    const velocityIntoSurface = this.vel.x * normalX + this.vel.y * normalY;
                    if (velocityIntoSurface < 0) {
                        this.vel.x -= velocityIntoSurface * normalX;
                        this.vel.y -= velocityIntoSurface * normalY;
                    }
                    resolvedCollision = true;
                }
            }

            if (!resolvedCollision) {
                break;
            }
        }
    }
    
    draw(buffer : any) {
        const playerImage = assets.player;
        if (!playerImage) {
            throw new Error('Player image has not been loaded.');
        }

        buffer.push();
        buffer.translate(this.pos.x + this.radius, this.pos.y + this.radius);
        buffer.rotate(this.rollAngle);
        buffer.image(playerImage, -this.radius, -this.radius, this.diameter, this.diameter);
        buffer.pop();
    }
}