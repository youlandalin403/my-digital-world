import fs from 'node:fs';
import path from 'node:path';
import { Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ROOM_ASSETS } from '../src/my-room/roomAssets.js';
const root='public/models/my-room/library';
const files=fs.readdirSync(root,{recursive:true}).filter(f=>/\.(glb|gltf)$/i.test(f)).sort();
const rows=[];
for(const file of files){
 const b=fs.readFileSync(path.join(root,file));
 const json=file.endsWith('.glb')?JSON.parse(b.subarray(20,20+b.readUInt32LE(12))):JSON.parse(b);
 const row={file:file.replaceAll('\\','/'),bytes:b.length,metadata:json.asset,images:json.images?.length||0};
 try {const gltf=await new GLTFLoader().parseAsync(file.endsWith('.glb')?b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength):b.toString(),'');const box=new Box3().setFromObject(gltf.scene);row.min=box.min.toArray();row.max=box.max.toArray();row.size=box.getSize(new Vector3()).toArray();}catch(e){row.error=e.message;}
 const selected=Object.entries(ROOM_ASSETS).find(([,a])=>a.url.endsWith('/library/'+row.file));
 if(selected){row.usedAs=selected[0];row.transform=selected[1];}
 rows.push(row);
}
fs.writeFileSync('review/my-room-library-inventory.json',JSON.stringify(rows,null,2)+'\n');
console.log('Scanned',rows.length,'Errors',rows.filter(r=>r.error));
console.log(rows.filter(r=>/Furniture|Bed Single|Rug|Houseplant.glb|Light Floor.glb|Table Lamp/.test(r.file)).map(r=>({file:r.file,min:r.min,size:r.size,metadata:r.metadata})));
