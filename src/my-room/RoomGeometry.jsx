import { Suspense } from 'react';
import RoomAsset from './RoomAsset';
import { ROOM_ASSETS, FURNISHINGS } from './roomAssets';
import { Interactable } from './InteractionManager';
import { OBJECTS, ROOM } from './roomConfig';
import { PALETTE } from './roomAtmosphere';
import WindowView from './WindowView';

function Box({ position = [0, 0, 0], size, color }) {
  return <mesh receiveShadow position={position}><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={.9} /></mesh>;
}

export default function RoomGeometry({ tea, drinkTea, openDiary, openGuestbook, canOpenDiary = false }) {
  const { width: w, depth: d, height: h, wallThickness: t } = ROOM;
  return <>
    <Box position={[0, -t / 2, 0]} size={[w + 2 * t, t, d + 2 * t]} color={PALETTE.floor} />
    <Box position={[0, h + t / 2, 0]} size={[w + 2 * t, t, d + 2 * t]} color={PALETTE.ceiling} />
    {/* Window opposite the entry/spawn, centered on the north wall. */}
    {[-1, 1].map(side => <Box key={side} position={[side * (w / 4 + .35), h / 2, -d / 2 - t / 2]} size={[w / 2 - .7, h, t]} color={PALETTE.wall} />)}
    <Box position={[0, .5, -d / 2 - t / 2]} size={[1.4, 1, t]} color={PALETTE.wall} />
    <Box position={[0, 2.45, -d / 2 - t / 2]} size={[1.4, .7, t]} color={PALETTE.wall} />
    <Suspense fallback={null}><RoomAsset name="window" /><WindowView /></Suspense>
    <Box position={[0, h / 2, d / 2 + t / 2]} size={[w, h, t]} color={PALETTE.wall} />
    <Box position={[-w / 2 - t / 2, h / 2, 0]} size={[t, h, d + 2 * t]} color={PALETTE.wall} />
    <Box position={[w / 2 + t / 2, h / 2, 0]} size={[t, h, d + 2 * t]} color={PALETTE.wall} />

    <Suspense fallback={null}>
      {FURNISHINGS.map(name => <RoomAsset key={name} name={name} />)}
    </Suspense>

    <Interactable {...OBJECTS.guestbook} onInteract={openGuestbook}><Box size={[.08, .7, 1.05]} color={PALETTE.woodShade} /></Interactable>
    <Interactable {...OBJECTS.diary} label={canOpenDiary ? OBJECTS.diary.label : 'Diary is locked'} onInteract={openDiary}><Box size={[.3, .05, .4]} color={PALETTE.diary} /></Interactable>
    <Interactable {...OBJECTS.tea} onInteract={drinkTea}>
      <Suspense fallback={null}>
        <RoomAsset name="mug">
          {tea > 0 && <group position={[0, ROOM_ASSETS.tea.levels[tea], 0]}><RoomAsset name="tea" /></group>}
        </RoomAsset>
      </Suspense>
    </Interactable>
  </>;
}

