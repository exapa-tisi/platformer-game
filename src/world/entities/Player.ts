declare const p5: any;

import {gravity} from '../WorldEnvronment';

export default class Player {
    p: typeof p5;
    pos: any;
    vel: any;
    touchingGround: boolean = false;
    jumpStrength: number = 20;

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

    squareSize: number = 80; //tempvar in case I assign a rect hitbox

    saveState: Array<keyof Player>;

    constructor(p: typeof p5, x: number, y: number) {
        this.p = p;
        this.pos = p.createVector(x, y);
        this.vel = p.createVector(0, 0);

        //this is so if I want to apply images to the player it doesnt save to local storage
        this.saveState = ["pos", "vel", "touchingGround"];
    }

    update() {
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
        const deltaSeconds = this.p.deltaTime / 1000;

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

        if (this.p.keyIsDown(this.p.UP_ARROW) && this.touchingGround) {
            this.vel.y = -this.jumpStrength; // Jump if touching the ground
        }

        this.vel.y += gravity;

        //deaccel the player if they are moving faster than the term velocity
        if (this.vel.y > this.termVelocity) {
            this.vel.y = this.p.lerp(this.vel.y, this.termVelocity, 0.1);
        }


        //handle collision with the ground
        if (this.pos.y + this.vel.y > this.p.height - this.squareSize) {
            this.vel.y = 0;
            this.pos.y = this.p.height - this.squareSize;
            this.touchingGround = true;
        } else {
            this.touchingGround = false;
        }

        this.pos.add(this.vel);
    }
    
    draw(buffer : any) {
        // Draw the player as a rectangle for now
        if (this.canDash) {
            buffer.fill(0, 255, 0); // Green if can dash
        } else {
            buffer.fill(255, 0, 0); // Red if cannot dash
        }
        buffer.rect(this.pos.x, this.pos.y, this.squareSize, this.squareSize);

        //draw a temporaty ground line for testing
        buffer.stroke(255, 0, 0);
        buffer.line(0, this.p.height, this.p.width, this.p.height);
        buffer.noStroke();
    }
}