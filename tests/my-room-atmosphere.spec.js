import { writeFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { installGuestPass } from './fixtures/guest-pass';
test('atmosphere room assets and side views',async({page})=>{
 await installGuestPass(page, { seed: true });
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/models/') && !r.ok())errors.push(`${r.status()} ${r.url()}`);});
 await page.goto('/my-room');await page.getByRole('button',{name:'Enter Room',exact:true}).click();
 await expect(page.locator('.room-scene')).toHaveAttribute('data-locked','true');
 await expect.poll(()=>page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.glb')).length)).toBe(12);
 await page.waitForTimeout(1000);
 await page.evaluate(() => document.dispatchEvent(new MouseEvent("mousemove", { movementX: 0, movementY: 0 })));
 await page.waitForTimeout(250);
 const aim=async(yaw,pitch)=>{const look=await page.locator('canvas').getAttribute('data-look');const [p,y]=look.split(',').map(Number);await page.evaluate(({x,y})=>document.dispatchEvent(new MouseEvent('mousemove',{movementX:x,movementY:y})),{x:Math.round((y-yaw)/.002),y:Math.round((p-pitch)/.002)});await page.waitForTimeout(150);};
 for(const [name,yaw,pitch] of [['entry',0,-.16],['desk',-.9,-.38],['storage',1.4,-.3]]){await aim(yaw,pitch);await aim(yaw,pitch);await expect.poll(async()=>{const p=(await page.locator("canvas").getAttribute("data-look")).split(",").map(Number);return Math.abs(p[0]-pitch)+Math.abs(p[1]-yaw);}).toBeLessThan(.01);await page.screenshot({path:`review/my-room-v06-${name}.png`});}
  const timing = await page.evaluate(() => new Promise(resolve => {
   const deltas = []; let last;
   const sample = now => { if (last !== undefined) deltas.push(now-last); last=now;
     if (deltas.length < 120) requestAnimationFrame(sample);
     else { deltas.sort((a,b)=>a-b); resolve({samples:deltas.length,medianMs:deltas[60],p95Ms:deltas[114],meanMs:deltas.reduce((a,b)=>a+b,0)/deltas.length}); }
   }; requestAnimationFrame(sample);
 }));
 writeFileSync('review/my-room-v06-frame-timing.json', JSON.stringify({context:'Headless Edge, stationary storage view, 120 requestAnimationFrame intervals; not a GPU benchmark or v0.5 comparison',...timing},null,2));
 expect(errors).toEqual([]);
});



