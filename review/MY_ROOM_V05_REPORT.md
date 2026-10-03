# My Room v0.5 furnishing report

Scanned all 249 local GLB/GLTF files; all parsed successfully. Selected 9; skipped 240. No downloads or application features added.

## Layout

Dark wood furniture, plum bedding and a burgundy rug form a quiet private room. The desk and chair remain on the east side; the twin bed occupies the northwest, bookcase the northeast, and closet the southwest. A low nightstand and plant sit beside the bed, below the window. The desk lamp and central rug complete the composition. The entrance/spawn, central aisle, window and west-wall Guestbook remain clear.

The three interaction anchors and distances are unchanged. Original window, mug and tea meshes remain active; all six generated models are retained in original/. Tea full/half/empty logic, movement, pointer lock, overlays, routes, Diary and Supabase code are untouched. Collision footprints in roomConfig.js now match the furniture bounds.

## Selected models and transforms

Positions and target sizes are metres; yaw is degrees. Scale is applied in model-local axes before yaw. Each source scene is centered in X/Z and grounded using a nested pivot offset; exact scales and pivot offsets are in roomAssets.js and the inventory JSON.

| Model / local source under library/ | Position | Yaw | Local scale XYZ | Normalized local size XYZ |
|---|---|---:|---|---|
| Furniture Pack-glb/Bed Twin.glb | -1.9, 0, -1.85 | 90 | 0.49979, 0.50079, 0.50017 | 1.03, 0.78, 2.13 |
| Furniture Pack-glb/Bookcase with Books.glb | 1.65, 0, -2.19 | 0 | 0.53205, 0.53392, 0.54184 | 0.98, 1.8, 0.36 |
| Furniture Pack-glb/Chair.glb | 1.55, 0, -0.4 | 90 | 0.88714, 0.89091, 0.79096 | 0.45, 0.95, 0.5 |
| Furniture Pack-glb/Closet.glb | -2.62, 0, 1.65 | 90 | 0.60547, 0.60453, 0.60919 | 0.94, 1.8, 0.53 |
| Furniture Pack-glb/Desk.glb | 2.4, 0, -0.4 | -90 | 0.98776, 0.85637, 0.94493 | 1.8, 0.79, 0.8 |
| Furniture Pack-glb/Night Stand.glb | -0.55, 0, -1.9 | 0 | 0.85076, 0.93798, 0.92766 | 0.5, 0.48, 0.47 |
| Ultimate House Interior Pack-glb/Houseplant.glb | -0.55, 0.48, -1.9 | 0 | 0.9978, 1.00028, 0.9978 | 0.25, 0.385, 0.25 |
| Ultimate House Interior Pack-glb/Round Rug.glb | -0.15, 0.004, 0.15 | 0 | 0.7221, 0.76257, 0.72298 | 1.8, 0.012, 1.83 |
| Ultimate House Interior Pack-glb/Table Lamp.glb | 2.48, 0.79, 0.25 | 0 | 0.59875, 0.60276, 0.59875 | 0.21, 0.46, 0.21 |

Retained originals: window position [0, 1.55, -2.47]; mug and tea at [0, 0, 0] relative to Tea's unchanged [2.2, .88, -.95] anchor. All have zero rotation and unit scale; liquid offsets remain .055 (full) and -.015 (half).

## Skipped assets

Food Kit is omitted entirely to avoid clutter and preserve the working Tea mesh. Alternate beds, sofas, tables and seats duplicate the chosen furniture or crowd the room. Bathroom/kitchen appliances are outside the room's purpose. Doors, windows, columns and curtains would compete with the existing shell/window. Additional lights and decor are unnecessary for this first pass. Exact unused files:

- Food Kit-glb/Apple Half.glb
- Food Kit-glb/Apple.glb
- Food Kit-glb/Avocado Half.glb
- Food Kit-glb/Bacon.glb
- Food Kit-glb/Bag Flat.glb
- Food Kit-glb/Bag.glb
- Food Kit-glb/Banana.glb
- Food Kit-glb/Barrel.glb
- Food Kit-glb/Beet.glb
- Food Kit-glb/Bottle Ketchup.glb
- Food Kit-glb/Bottle Musterd.glb
- Food Kit-glb/Bowl Broth.glb
- Food Kit-glb/Bowl Cereal.glb
- Food Kit-glb/Bowl Soup.glb
- Food Kit-glb/Bread.glb
- Food Kit-glb/Broccoli.glb
- Food Kit-glb/Burger Cheese.glb
- Food Kit-glb/Burger.glb
- Food Kit-glb/Cabbage.glb
- Food Kit-glb/Cake Birthday.glb
- Food Kit-glb/Cake Slicer.glb
- Food Kit-glb/Cake.glb
- Food Kit-glb/Can Open.glb
- Food Kit-glb/Can Small.glb
- Food Kit-glb/Can.glb
- Food Kit-glb/Candy Bar Wrapper.glb
- Food Kit-glb/Capsicum.glb
- Food Kit-glb/Carrot.glb
- Food Kit-glb/Carton Small.glb
- Food Kit-glb/Carton.glb
- Food Kit-glb/Cauliflower.glb
- Food Kit-glb/Cheese Cut.glb
- Food Kit-glb/Cheese Slicer.glb
- Food Kit-glb/Cherries.glb
- Food Kit-glb/Chinese.glb
- Food Kit-glb/Chocolate Wrapper.glb
- Food Kit-glb/Chocolate.glb
- Food Kit-glb/Chopstick Fancy.glb
- Food Kit-glb/Cocktail.glb
- Food Kit-glb/Coconut Half.glb
- Food Kit-glb/Cookie Chocolate.glb
- Food Kit-glb/Cookie.glb
- Food Kit-glb/Cooking Fork.glb
- Food Kit-glb/Cooking Knife Chopping.glb
- Food Kit-glb/Cooking Knife.glb
- Food Kit-glb/Cooking Spatula.glb
- Food Kit-glb/Cooking Spoon.glb
- Food Kit-glb/Corn Dog.glb
- Food Kit-glb/Corn.glb
- Food Kit-glb/Croissant.glb
- Food Kit-glb/Cup Tea-M2sVC8jbmi.glb
- Food Kit-glb/Cup Tea.glb
- Food Kit-glb/Cup.glb
- Food Kit-glb/Cupcake.glb
- Food Kit-glb/Cutting Board.glb
- Food Kit-glb/Donut Chocolate.glb
- Food Kit-glb/Donut Sprinkles.glb
- Food Kit-glb/Egg Cooked.glb
- Food Kit-glb/Egg Cup.glb
- Food Kit-glb/Egg.glb
- Food Kit-glb/Eggplant.glb
- Food Kit-glb/Fish Bones.glb
- Food Kit-glb/Fish.glb
- Food Kit-glb/Frappe.glb
- Food Kit-glb/Fries.glb
- Food Kit-glb/Frying Pan.glb
- Food Kit-glb/Ginger Bread Cutter.glb
- Food Kit-glb/Ginger Bread.glb
- Food Kit-glb/Glass Wine.glb
- Food Kit-glb/Grapes.glb
- Food Kit-glb/Honey.glb
- Food Kit-glb/Hot Dog.glb
- Food Kit-glb/Ice Cream.glb
- Food Kit-glb/Knife Block.glb
- Food Kit-glb/Leek.glb
- Food Kit-glb/Lemon Half.glb
- Food Kit-glb/Lemon.glb
- Food Kit-glb/Loaf Baguette.glb
- Food Kit-glb/Loaf Round.glb
- Food Kit-glb/Loaf.glb
- Food Kit-glb/Lollypop.glb
- Food Kit-glb/Meat Patty.glb
- Food Kit-glb/Meat Raw.glb
- Food Kit-glb/Meat Ribs.glb
- Food Kit-glb/Meat Sausage.glb
- Food Kit-glb/Meat Tenderizer.glb
- Food Kit-glb/Mincemeat Pie.glb
- Food Kit-glb/Muffin.glb
- Food Kit-glb/Mug.glb
- Food Kit-glb/Mushroom Half.glb
- Food Kit-glb/Mushroom.glb
- Food Kit-glb/Mussel Open.glb
- Food Kit-glb/Onion Half.glb
- Food Kit-glb/Onion.glb
- Food Kit-glb/Orange.glb
- Food Kit-glb/Pan Stew.glb
- Food Kit-glb/Pan.glb
- Food Kit-glb/Pancakes.glb
- Food Kit-glb/Peanut Butter.glb
- Food Kit-glb/Pear Half.glb
- Food Kit-glb/Pear.glb
- Food Kit-glb/Pepper Mill.glb
- Food Kit-glb/Pepper.glb
- Food Kit-glb/Pie.glb
- Food Kit-glb/Pineapple.glb
- Food Kit-glb/Pizza Box.glb
- Food Kit-glb/Pizza Cutter.glb
- Food Kit-glb/Pizza.glb
- Food Kit-glb/Popsicle Chocolate.glb
- Food Kit-glb/Popsicle.glb
- Food Kit-glb/Pot Stew.glb
- Food Kit-glb/Pudding.glb
- Food Kit-glb/Pumpkin Basic.glb
- Food Kit-glb/Pumpkin.glb
- Food Kit-glb/Radish.glb
- Food Kit-glb/Rice Ball.glb
- Food Kit-glb/Rolling Pin.glb
- Food Kit-glb/Salad.glb
- Food Kit-glb/Sandwich.glb
- Food Kit-glb/Sausage.glb
- Food Kit-glb/Shaker Salt.glb
- Food Kit-glb/Skewer Vegetables.glb
- Food Kit-glb/Soda Can Crushed.glb
- Food Kit-glb/Soda Can.glb
- Food Kit-glb/Soda Glass.glb
- Food Kit-glb/Soda.glb
- Food Kit-glb/Soy.glb
- Food Kit-glb/Steamer.glb
- Food Kit-glb/Strawberry.glb
- Food Kit-glb/Styrofoam Dinner.glb
- Food Kit-glb/Styrofoam.glb
- Food Kit-glb/Sub.glb
- Food Kit-glb/Sundae.glb
- Food Kit-glb/Sushi Egg.glb
- Food Kit-glb/Sushi Salmon.glb
- Food Kit-glb/Taco.glb
- Food Kit-glb/Tomato Slice.glb
- Food Kit-glb/Tomato.glb
- Food Kit-glb/Turkey.glb
- Food Kit-glb/Utensil Fork.glb
- Food Kit-glb/Utensil Knife.glb
- Food Kit-glb/Utensil Spoon.glb
- Food Kit-glb/Waffle.glb
- Food Kit-glb/Watermelon.glb
- Food Kit-glb/Whipped Cream.glb
- Food Kit-glb/Whisk.glb
- Food Kit-glb/Whole Ham.glb
- Food Kit-glb/Wine Red.glb
- Furniture Pack-glb/Bed Double.glb
- Furniture Pack-glb/Chair-9kIjuRFMFw.glb
- Furniture Pack-glb/Door-JuTzNjtD54.glb
- Furniture Pack-glb/Door-QiMLelTBId.glb
- Furniture Pack-glb/Door.glb
- Furniture Pack-glb/Office Chair.glb
- Furniture Pack-glb/Short Closet.glb
- Furniture Pack-glb/Sofa-X5kQPKzAWp.glb
- Furniture Pack-glb/Sofa-vuo7KBehok.glb
- Furniture Pack-glb/Sofa.glb
- Furniture Pack-glb/Stool.glb
- Furniture Pack-glb/Table-yYEEJzKxb4.glb
- Furniture Pack-glb/Table.glb
- Ultimate House Interior Pack-glb/Bathroom Sink.glb
- Ultimate House Interior Pack-glb/Bathroom Toilet Paper.glb
- Ultimate House Interior Pack-glb/Bathtub.glb
- Ultimate House Interior Pack-glb/Bed King.glb
- Ultimate House Interior Pack-glb/Bed Single.glb
- Ultimate House Interior Pack-glb/Bunk Bed.glb
- Ultimate House Interior Pack-glb/Cactus.glb
- Ultimate House Interior Pack-glb/Ceiling Light.glb
- Ultimate House Interior Pack-glb/Chair-Rlyhe93NNe.glb
- Ultimate House Interior Pack-glb/Chair.glb
- Ultimate House Interior Pack-glb/Column Round.glb
- Ultimate House Interior Pack-glb/Couch Large.glb
- Ultimate House Interior Pack-glb/Couch Medium-mWgQ94zhDZ.glb
- Ultimate House Interior Pack-glb/Couch Medium.glb
- Ultimate House Interior Pack-glb/Couch Small-X9msj0gtb5.glb
- Ultimate House Interior Pack-glb/Couch Small.glb
- Ultimate House Interior Pack-glb/Curtains Double.glb
- Ultimate House Interior Pack-glb/Dead Houseplant.glb
- Ultimate House Interior Pack-glb/Door Double.glb
- Ultimate House Interior Pack-glb/Door-8it1hH1oRu.glb
- Ultimate House Interior Pack-glb/Door-KGt4ztcKrM.glb
- Ultimate House Interior Pack-glb/Door-LI93WgnjyS.glb
- Ultimate House Interior Pack-glb/Door-atrxVW0q9N.glb
- Ultimate House Interior Pack-glb/Door-b0AIfzp6VL.glb
- Ultimate House Interior Pack-glb/Door-ihXwSN12P1.glb
- Ultimate House Interior Pack-glb/Door-xuFNaNLzfE.glb
- Ultimate House Interior Pack-glb/Door.glb
- Ultimate House Interior Pack-glb/Drawer-8xZQEZL2w3.glb
- Ultimate House Interior Pack-glb/Drawer-G1H0wnCHQf.glb
- Ultimate House Interior Pack-glb/Drawer-N3ERi89OeO.glb
- Ultimate House Interior Pack-glb/Drawer-T4uDbyP90C.glb
- Ultimate House Interior Pack-glb/Drawer.glb
- Ultimate House Interior Pack-glb/Fireplace.glb
- Ultimate House Interior Pack-glb/Houseplant-IBLX2Jz90O.glb
- Ultimate House Interior Pack-glb/Houseplant-VtJh4Irl4w.glb
- Ultimate House Interior Pack-glb/Houseplant-bfLOqIV5uP.glb
- Ultimate House Interior Pack-glb/Houseplant-dveIJ0xNpX.glb
- Ultimate House Interior Pack-glb/Houseplant-f6GPjbEgg0.glb
- Ultimate House Interior Pack-glb/Kitchen Fridge.glb
- Ultimate House Interior Pack-glb/Kitchen Sink.glb
- Ultimate House Interior Pack-glb/L Couch.glb
- Ultimate House Interior Pack-glb/Lamp.glb
- Ultimate House Interior Pack-glb/Light Ceiling Single.glb
- Ultimate House Interior Pack-glb/Light Ceiling-NNlnaiDJIh.glb
- Ultimate House Interior Pack-glb/Light Ceiling-ToOLJDO5FI.glb
- Ultimate House Interior Pack-glb/Light Ceiling.glb
- Ultimate House Interior Pack-glb/Light Chandelier.glb
- Ultimate House Interior Pack-glb/Light Cube-gJpALEpLcy.glb
- Ultimate House Interior Pack-glb/Light Cube.glb
- Ultimate House Interior Pack-glb/Light Desk.glb
- Ultimate House Interior Pack-glb/Light Floor-eBQtooeh43.glb
- Ultimate House Interior Pack-glb/Light Floor.glb
- Ultimate House Interior Pack-glb/Light Icosahedron.glb
- Ultimate House Interior Pack-glb/Light Stand.glb
- Ultimate House Interior Pack-glb/Night Stand-08S1j15Jcx.glb
- Ultimate House Interior Pack-glb/Night Stand-7cobkfclNv.glb
- Ultimate House Interior Pack-glb/Night Stand.glb
- Ultimate House Interior Pack-glb/Oven.glb
- Ultimate House Interior Pack-glb/Rug.glb
- Ultimate House Interior Pack-glb/Shelf Large.glb
- Ultimate House Interior Pack-glb/Shelf Small-TfdgUV2RYe.glb
- Ultimate House Interior Pack-glb/Shelf Small.glb
- Ultimate House Interior Pack-glb/Square Plate.glb
- Ultimate House Interior Pack-glb/Stool.glb
- Ultimate House Interior Pack-glb/Table Round Large.glb
- Ultimate House Interior Pack-glb/Table Round Small-57W671WvS2.glb
- Ultimate House Interior Pack-glb/Table Round Small.glb
- Ultimate House Interior Pack-glb/Toilet Paper stack.glb
- Ultimate House Interior Pack-glb/Toilet.glb
- Ultimate House Interior Pack-glb/Towel Rack.glb
- Ultimate House Interior Pack-glb/Trashcan Large.glb
- Ultimate House Interior Pack-glb/Trashcan Small-ZWYTK2SmBA.glb
- Ultimate House Interior Pack-glb/Trashcan Small.glb
- Ultimate House Interior Pack-glb/Trashcan-XSwahu252t.glb
- Ultimate House Interior Pack-glb/Trashcan.glb
- Ultimate House Interior Pack-glb/Washing Machine.glb
- Ultimate House Interior Pack-glb/Window Large.glb
- Ultimate House Interior Pack-glb/Window Round.glb
- Ultimate House Interior Pack-glb/Window Small.glb

## Verification

- npm test: 50 existing unit/service/database tests passed, including Diary RLS.
- node --test scripts/room-furnishing.test.mjs: model loading, transformed bounds, grounding, desktop height and continuous routes from spawn passed (2 tests).
- Browser suite: existing four My Room tests cover native movement/pointer lock, range/focus gates, all Tea states, Guestbook, Diary owner/visitor behavior, save/read failure recovery, overlay continuity and logout. A furnishing test checks 12 model requests, no runtime/model HTTP errors, and captures entry/desk/storage views.
- npm run build: passed; existing large-chunk warning remains.
- Visual inspection: entry, desk and storage screenshots; no obvious floating furniture, severe clipping or z-fighting.

## Known limitations

Furniture uses conservative rectangular collision footprints; spaces below desks/chairs and between decorative legs are intentionally not walkable. Rug and tabletop decor have no separate movement collision. The lamp is decorative and uses existing scene lighting. Original flat window and Guestbook board remain visually simpler than the new furniture. No shadows were added. Creator/license information was not supplied with the library, so attribution is explicitly unresolved rather than guessed.

## Files changed/added

- src/my-room/roomAssets.js — central URLs, pivots, positions, rotations, scales and furnishing list.
- src/my-room/RoomAsset.jsx — pivot compensation.
- src/my-room/RoomGeometry.jsx — render registered furnishings.
- src/my-room/roomConfig.js — updated solid footprints.
- scripts/scan-room-library.mjs — repeatable complete inventory scan.
- scripts/room-furnishing.test.mjs — model bounds and route verification.
- tests/my-room-furnishing.spec.js — asset-load and visual smoke test.
- playwright.furnishing.config.js — isolated test port because the normal port was occupied.
- public/models/my-room/README.md — provenance and usage notes.
- review/MY_ROOM_V05_REPORT.md, my-room-library-inventory.json, my-room-library-scan.txt, my-room-v05-*.png — report, complete inventory and screenshots.
- Existing review/my-room-v03-*.png refreshed by the unchanged regression suite; dist/ regenerated by the production build.
Browser runner note: all 5 cases reported OK, but Playwright remained running during web-server teardown on Windows. The runner was interrupted after completion of the cases, so it did not produce a clean exit summary. The default test port 4188 was already occupied; the isolated configuration used 4193. Existing server on 4188 was left untouched.

