declare const p5: any;

// @ts-ignore PNG assets are resolved by the bundler, which may not provide TypeScript declarations.
import GrassTopImage from '../assets/old/tiles/grass_top.png';
// @ts-ignore
import GrassFullImage from '../assets/old/tiles/grass_full.png';
// @ts-ignore
import TreeBackground from '../assets/old/background/tree.png';
// @ts-ignore
import PlayerImage from '../assets/old/player/player_first.png';

export const assets: { [key: string]: any } = {};

export const assetList: { [key: string]: string } = {
    grassTop: GrassTopImage,
    grassFull: GrassFullImage,

    treeBackground: TreeBackground,
    player: PlayerImage,
};

export default class AssetLoader {
    static async loadAssets(p: typeof p5, assetList: { [key: string]: string }) {
        const loadedAssets = await Promise.all(
            Object.entries(assetList).map(async ([key, path]) => [key, await p.loadImage(path)] as const),
        );

        for (const [key, asset] of loadedAssets) {
            assets[key] = asset;
        }
    }
}