// Reproducible image preparation; requires the supplied bundled sharp module.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require(process.argv[2]||'sharp');
const root=path.resolve(__dirname,'..'),generated=process.argv[3];
const specs=[
 ['exec-75325ae2-807f-4b25-b7b9-e6ba8524b629.png','postage-v1.png','roam-pixel-postage-v1.webp',600,42],
 ['exec-6d136aa8-1763-4778-8792-b4463267f505.png','seals-alpha-v1.png','roam-pixel-seals-alpha-v1.webp',384,55],
 ['exec-7a02a692-2f95-41c3-bb3d-2400a2ed76c2.png','album-v1.png','roam-pixel-album-v1.webp',288,50]
];
(async()=>{
 const archive=path.join(root,'assets/concepts/batch-07-pixel-collectibles');await fs.mkdir(archive,{recursive:true});
 const manifest=[];
 for(const [source,original,name,width,quality] of specs){
  const bytes=await fs.readFile(generated?path.join(generated,source):path.join(archive,original));await fs.writeFile(path.join(archive,original),bytes);
  const result=await sharp(bytes).resize({width,kernel:'nearest'}).webp({quality,alphaQuality:50,effort:6}).toFile(path.join(root,'public',name));
  manifest.push({original,name,width:result.width,height:result.height,quality,bytes:result.size,originalSHA256:crypto.createHash('sha256').update(bytes).digest('hex')});
 }
 await fs.writeFile(path.join(archive,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(manifest,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
