// Original, texture-free low-poly models. Run: node scripts/build-room-assets.mjs
import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mkdir, writeFile } from 'node:fs/promises';
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.(); }); }
};
const out = new URL('../public/models/my-room/', import.meta.url);
await mkdir(out, { recursive: true });
const mat = color => new T.MeshStandardMaterial({ color, roughness: .85 });
const wood = mat('#84654b'), edge = mat('#71553e'), ceramic = mat('#ece8d8');
function mesh(g, geometry, material, p = [0,0,0], rotation = [0,0,0]) {
  const m = new T.Mesh(geometry, material); m.position.set(...p); m.rotation.set(...rotation); g.add(m); return m;
}
const box = (g, s, p, m = wood) => mesh(g, new T.BoxGeometry(...s), m, p);
const cylinder = (g, top, bottom, height, p, m, n = 10) => mesh(g, new T.CylinderGeometry(top,bottom,height,n),m,p);
async function save(name, g) {
  const data = await new GLTFExporter().parseAsync(g, { binary: true });
  await writeFile(new URL(`${name}.glb`, out), Buffer.from(data));
}
const desk = new T.Group();
// A beveled solid top with inset apron and tapered legs, in the original footprint.
const top = new T.Shape(); const x=.4,z=.9,c=.025;
top.moveTo(-x+c,-z); top.lineTo(x-c,-z); top.lineTo(x,-z+c); top.lineTo(x,z-c); top.lineTo(x-c,z); top.lineTo(-x+c,z); top.lineTo(-x,z-c); top.lineTo(-x,-z+c); top.closePath();
mesh(desk,new T.ExtrudeGeometry(top,{depth:.06,bevelEnabled:true,bevelSize:.008,bevelThickness:.01,bevelSegments:1,steps:1}),wood,[0,.72,0],[-Math.PI/2,0,0]);
for(const a of [-.3,.3]) for(const b of [-.8,.8]) {
  const leg = cylinder(desk,.055,.035,.71,[a,.355,b],edge,4); leg.rotation.y=Math.PI/4;
}
for(const a of [-.31,.31]) box(desk,[.04,.12,1.65],[a,.65,0],edge);
for(const b of [-.81,.81]) box(desk,[.64,.12,.04],[0,.65,b],edge);
await save('desk',desk);
const chair = new T.Group();
box(chair,[.45,.08,.45],[0,.45,0]);
box(chair,[.40,.025,.40],[0,.502,0],mat('#9b9b7e'));
for(const a of [-.185,.185]) for(const b of [-.185,.185]) cylinder(chair,.038,.026,.41,[a,.205,b],edge,4);
for(const b of [-.19,.19]) box(chair,[.055,.64,.055],[-.24,.73,b],edge);
for(const y of [.72,.91]) box(chair,[.06,.10,.43],[-.24,y,0]);
await save('chair',chair);
const plant = new T.Group(), soil=mat('#594739'), green=mat('#556953'), lightGreen=mat('#778667');
cylinder(plant,.19,.14,.40,[0,.20,0],mat('#ad9477'));
cylinder(plant,.20,.20,.065,[0,.4125,0],wood);
cylinder(plant,.178,.178,.012,[0,.449,0],soil);
cylinder(plant,.015,.019,.44,[0,.66,0],green,6);
for(let i=0;i<7;i++) {
 const angle=i*2.4, y=.55+i*.048;
 const leaf=mesh(plant,new T.IcosahedronGeometry(1,0),i%2?green:lightGreen,[Math.cos(angle)*.095,y,Math.sin(angle)*.095]);
 leaf.scale.set(.115,.035,.065); leaf.rotation.set(.2, -angle,.35);
}
await save('plant',plant);
const mug = new T.Group();
const profile = [[0,-.08],[.061,-.08],[.075,.08],[.065,.08],[.055,-.064],[0,-.064]].map(p=>new T.Vector2(...p));
mesh(mug,new T.LatheGeometry(profile,16),ceramic);
mesh(mug,new T.TorusGeometry(.046,.013,6,12,Math.PI*1.6),ceramic,[.076,.002,0],[0,0,-Math.PI*.8]);
await save('mug',mug);
const tea = new T.Group();
mesh(tea,new T.CircleGeometry(.063,16),mat('#a87030'),[0,0,0],[-Math.PI/2,0,0]);
await save('tea',tea);
const windowModel = new T.Group();
box(windowModel,[1.4,1.1,.03],[0,0,-.10],mat('#d8ddd4'));
for(const y of [-.55,.55]) box(windowModel,[1.5,.06,.12],[0,y,0]);
for(const a of [-.7,.7]) box(windowModel,[.06,1.1,.12],[a,0,0]);
box(windowModel,[.035,1.04,.06],[0,0,0],edge);
box(windowModel,[1.34,.035,.06],[0,0,0],edge);
box(windowModel,[1.52,.05,.20],[0,-.575,.015]);
await save('window',windowModel);
