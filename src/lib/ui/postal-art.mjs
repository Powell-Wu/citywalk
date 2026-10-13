import {cardArtKey} from './art.mjs';
export const POSTAL_ART={hero:'journey-departure.webp',stamps:'roam-pixel-postage-v1.webp',seals:'roam-pixel-seals-alpha-v1.webp',cover:'roam-pixel-album-v1.webp'};
export const STAMP_NAMES=['街角发现','留一点时间','一起决定','沿途未定','城市细节','默契同行'];
export function stampForCard(card){return {explore:0,challenge:3,discover:4,track:0,talk:1,shop:1,photo:4,sound:4,cooperate:2}[cardArtKey(card)]??0;}
export function stampForJourney(journey){return journey?.journeyTheme==='observe'?4:journey?.journeyTheme==='duo'?5:journey?.branch==='sounds'?4:3;}
export function spritePosition(index){return `${index%3*50}% ${Math.floor(index/3)*100}%`;}
export function spriteRect(image,index){return [index%3*image.width/3,Math.floor(index/3)*image.height/2,image.width/3,image.height/2];}
