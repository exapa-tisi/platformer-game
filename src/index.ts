/// <reference types="p5" />

// Tell TypeScript that 'p5' is globally available from our CDN script
declare const p5: any;

import Player from './world/entities/Player';
import GameState from './GameState';

const VIRTUAL_WIDTH = 1920;
const VIRTUAL_HEIGHT = 1080; 

let gameBuffer;
let scaleFactor = 1;

// let xOffset = (windowWidth - (VIRTUAL_WIDTH * scaleFactor)) / 2;
// let yOffset = (windowHeight - (VIRTUAL_HEIGHT * scaleFactor)) / 2;

// let virtualMouseX = (mouseX - xOffset) / scaleFactor;
// let virtualMouseY = (mouseY - yOffset) / scaleFactor;


const sketch = (p: typeof p5) => {
    let x = 100;
  
    let GameStateInstance: GameState;

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.gameBuffer = p.createGraphics(p.windowWidth, p.windowHeight);
        p.calculateScale();

        GameStateInstance = new GameState(p);
    };

    p.draw = () => {
        p.background(0); // Letterbox color

        var buffer = p.gameBuffer;

        // Clear the buffer each frame
        buffer.clear();
        buffer.background(20); 

        // 3. Save state and apply the global scale matrix inside the buffer
        buffer.push();
    
        // Center the virtual canvas inside the high-res buffer
        let xOffset = (p.windowWidth - (VIRTUAL_WIDTH * scaleFactor)) / 2;
        let yOffset = (p.windowHeight - (VIRTUAL_HEIGHT * scaleFactor)) / 2;
        buffer.translate(xOffset, yOffset);
        buffer.scale(scaleFactor);

        // GAME LOGIC AND DRAWING GOES HERE
        GameStateInstance.update();
        GameStateInstance.draw(buffer, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
        
        //GAME LOGIC END
        buffer.pop(); // Restore state so scale doesn't compound

        // 4. Output the buffer 1:1 to the main canvas
        p.image(buffer, 0, 0);
    };

    p.calculateScale = () => {
        // Calculate how much to scale the 1920x1080 virtual canvas to fit the window
        scaleFactor = p.min(p.windowWidth / VIRTUAL_WIDTH, p.windowHeight / VIRTUAL_HEIGHT);
    }

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        // Resize the buffer so it matches the new high-res window dimensions
        p.gameBuffer.resizeCanvas(p.windowWidth, p.windowHeight);
        p.calculateScale();
    }
};

// Instantiate using the global p5 object
new p5(sketch);
