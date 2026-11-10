declare const p5: any;

// @ts-ignore PNG assets are resolved by the bundler, which may not provide TypeScript declarations.
import GrassImage from '../assets/grass_temp.png';

export var assets: { [key: string]: any } = {};

export var assetList: { [key: string]: string } = {
    'grass': GrassImage,
};

export default class AssetLoader {
    static async loadAssets(p: typeof p5, assetList: { [key: string]: string }) {
        const assetPromises = Object.entries(assetList).map(async ([key, path]) => {
            const asset = await p.loadImage(path);
            assets[key] = asset;
        });

        await Promise.all(assetPromises);
    }
}