declare const p5: any;

export default class SpriteSheetAnimation {
    private p: typeof p5;
    private sheet: any;
    private frameWidth: number;
    private frameHeight: number;
    private totalFrames: number;
    private speed: number;
    private frameIndex: number;

    constructor(
        p5Instance: typeof p5, 
        imagePath: string, 
        frameWidth: number, 
        frameHeight: number, 
        totalFrames: number, 
        speed: number = 0.1
    ) {
        this.p = p5Instance;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.totalFrames = totalFrames;
        this.speed = speed;
        this.frameIndex = 0;

        // Load the image asset via the passed p5 instance
        this.sheet = this.p.loadImage(imagePath);
    }

    /**
     * Updates the animation frame timer.
     */
    public update(): void {
        this.frameIndex += this.speed;
        if (this.frameIndex >= this.totalFrames) {
            this.frameIndex = 0;
        }
    }

    /**
     * Draws the current frame of the sprite sheet to the canvas.
     * @param x Destination X coordinate on canvas
     * @param y Destination Y coordinate on canvas
     */
    public draw(x: number, y: number): void {
        // Calculate the horizontal source X position on the sprite sheet grid
        const sx = Math.floor(this.frameIndex) * this.frameWidth;
        const sy = 0; // Target row 0 (assumes a single-row animation strip)

        // Slices the image using p5's 9-parameter image() function
        this.p.image(
            this.sheet, 
            x, y, 
            this.frameWidth, this.frameHeight, // Destination size
            sx, sy, 
            this.frameWidth, this.frameHeight  // Source cropping bounds
        );
    }
}
