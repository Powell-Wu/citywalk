// Optional local asset preparation: node scripts/prepare-art.cjs <sharp module path>
// Published WebP files are committed; deployment does not need sharp or originals.
const sharp=require(process.argv[2]||'sharp');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const files=[
 ['batch-02-game-homages/01-zelda-hidden-door-v1.png','art-explore.webp',600],
 ['batch-02-game-homages/02-mario-secret-route-v1.png','art-challenge.webp',600],
 ['batch-02-game-homages/03-cyberpunk-hidden-gig-v1.png','art-discover.webp',600],
 ['batch-02-game-homages/04-witcher-city-tracks-v1.png','art-track.webp',600],
 ['batch-01/02-talk-park-bench-v1.png','art-talk.webp',600],
 ['batch-01/03-event-street-shop-v1.png','art-shop.webp',600],
 ['batch-03-rewards/01-chest-closed-v1.png','chest-closed.webp',400],
 ['batch-03-rewards/02-chest-open-v1.png','chest-open.webp',400],
 ['batch-03-rewards/03-explorer-badge-v1.png','explorer-badge.webp',256],
 ['batch-03-rewards/04-card-back-v1.png','card-back.webp',480],
 ['batch-04-journey/01-departure-v1.png','journey-departure.webp',960],
 ['batch-04-journey/02-keepsake-v1.png','journey-keepsake.webp',960]
];
(async()=>{for(const [source,name,width] of files){const result=await sharp(path.join(root,'assets/concepts',source)).resize({width,kernel:'nearest'}).webp({quality:78,alphaQuality:100,effort:6}).toFile(path.join(root,'dist',name));console.log(name,result.size);}})().catch(e=>{console.error(e);process.exitCode=1;});
