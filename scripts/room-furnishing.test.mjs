import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Box3, Group } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ROOM_ASSETS, FURNISHINGS } from '../src/my-room/roomAssets.js';
import { OBSTACLES, ROOM } from '../src/my-room/roomConfig.js';
test('all placed assets load; solid bounds match collision and support surfaces', async()=>{
 for(const [name,a] of Object.entries(ROOM_ASSETS)) {
  const bytes=fs.readFileSync('public'+a.url);
  const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const root=new Group(), pivot=new Group();root.position.set(...a.position);root.rotation.set(...a.rotation);root.scale.set(...a.scale);pivot.position.set(...(a.pivot||[0,0,0]));pivot.add(scene);root.add(pivot);
  const box=new Box3().setFromObject(root), solid=OBSTACLES.find(b=>b.id===name);
  if(solid){assert.ok(box.min.x>=solid.minX-.001 && box.max.x<=solid.maxX+.001 && box.min.z>=solid.minZ-.001 && box.max.z<=solid.maxZ+.001,name+' footprint');assert.ok(Math.abs(box.min.y)<.001,name+' grounded');}
  if(FURNISHINGS.includes(name)){assert.ok(box.min.x>=-3 && box.max.x<=3 && box.min.z>=-2.5 && box.max.z<=2.5,name+' inside shell');}
  if(name==='desk') assert.ok(Math.abs(box.max.y-.79)<.001,'diary base and mug base sit on desktop');
 }
});
test('spawn has continuous walking routes to interactions and furniture fronts',()=>{
 const step=.05, r=ROOM.playerRadius;
 const fits=(x,z)=>Math.abs(x)<=3-r && Math.abs(z)<=2.5-r && !OBSTACLES.some(b=>x>b.minX-r && x<b.maxX+r && z>b.minZ-r && z<b.maxZ+r);
 const queue=[[0,31]], seen=new Set(['0,31']);
 for(let n=0;n<queue.length;n++){const [x,z]=queue[n];for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,key=`${nx},${nz}`;if(!seen.has(key)&&fits(nx*step,nz*step)){seen.add(key);queue.push([nx,nz]);}}}
 for(const [name,x,z] of [['tea',1.4,-1.05],['diary',1.4,.35],['guestbook',-1.6,-.2],['window',0,-2.25],['bed',-1.7,-.9],['closet',-1.9,1.65],['bookcase',1.3,-1.6]]) assert.ok(seen.has(`${Math.round(x/step)},${Math.round(z/step)}`),name+' reachable');
});
