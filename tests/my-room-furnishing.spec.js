import { test, expect } from '@playwright/test';
import { installGuestPass } from './fixtures/guest-pass';
test('furnished room assets and side views',async({page})=>{
 await installGuestPass(page, { seed: true });
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/models/') && !r.ok())errors.push(`${r.status()} ${r.url()}`);});
 await page.goto('/my-room');await page.getByRole('button',{name:'Enter Room',exact:true}).click();
 await expect(page.locator('.room-scene')).toHaveAttribute('data-locked','true');
 await expect.poll(()=>page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.glb')).length)).toBe(12);
 await page.waitForTimeout(1000);
 const aim=async(yaw,pitch)=>{const look=await page.locator('canvas').getAttribute('data-look');const [p,y]=look.split(',').map(Number);await page.evaluate(({x,y})=>document.dispatchEvent(new MouseEvent('mousemove',{movementX:x,movementY:y})),{x:Math.round((y-yaw)/.002),y:Math.round((p-pitch)/.002)});await page.waitForTimeout(150);};
 for(const [name,yaw,pitch] of [['entry',0,-.16],['desk',-.9,-.38],['storage',1.4,-.3]]){await aim(yaw,pitch);await page.screenshot({path:`review/my-room-v05-${name}.png`});}
 expect(errors).toEqual([]);
});
