// Original vector outlines. Shared by the header, exports and generated PWA assets.
export const brandInk='#17354d';
export const brandPaper='#fff8e9';
export const symbolBody='<g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 48V20M21 35C21 24 29 19 38 22"/></g><circle cx="46" cy="25" r="3" fill="currentColor"/>';
export const wordmarkBody='<g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 62V20M10 38C10 24 23 18 35 23"/><ellipse cx="70" cy="41" rx="19" ry="21"/><path d="M141 20V62M141 41C141 28 134 20 122 20C110 20 103 28 103 41C103 54 110 62 122 62C134 62 141 54 141 41M159 62V20M159 37C159 26 165 20 174 20C183 20 189 26 189 37V62M189 37C189 26 195 20 204 20C213 20 219 26 219 37V62"/></g>';
export const symbolSvg=(color=brandInk)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" color="${color}">${symbolBody}</svg>`;
export const wordmarkSvg=(color=brandInk)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 232 76" color="${color}">${wordmarkBody}</svg>`;
// The complete foreground lies inside the central 80% maskable safe circle.
export const appIconSvg=(size=512)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512" color="${brandInk}"><rect width="512" height="512" fill="${brandPaper}"/><g transform="translate(32 32) scale(7)">${symbolBody}</g></svg>`;
export function drawBrand(ctx,x,y,height){
 const scale=height/76;
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.strokeStyle=brandInk;ctx.fillStyle=brandInk;ctx.lineWidth=6;ctx.lineCap='round';ctx.lineJoin='round';
 // Keep the same path geometry as the SVG wordmark; Path2D is available in browsers.
 for(const match of wordmarkBody.matchAll(/<path d="([^"]+)"/g))ctx.stroke(new Path2D(match[1]));
 ctx.beginPath();ctx.ellipse(70,41,19,21,0,0,Math.PI*2);ctx.stroke();ctx.restore();
}
