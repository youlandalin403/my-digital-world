# My Room v0.4 Asset Pass 1

Replaced the desk, chair, plant, mug/tea and window with local original GLB
models. The desk has a beveled top, apron and tapered legs; the chair has a
slatted back and seat pad; the plant has faceted leaves and a rimmed pot; the
mug has a solid wall and handle; the window has mullions and a sill.

`src/my-room/roomAssets.js` centralizes URLs and visual transforms.
`RoomAsset.jsx` loads cached glTF scenes and clones instances without changing
interaction registration. Tea retains the original two drinking steps and
configured liquid heights. Asset loading uses local Suspense boundaries.

No changes to room layout, movement/controller, collision configuration,
interaction anchors, Guestbook/Diary behavior, lighting, or post-processing.

Validation: production build passed (existing large-chunk warning remains);
all four room unit tests and all four My Room browser regression tests passed.
Entry render inspected visually. The existing browser suite writes its review
screenshots under the historical `my-room-v03-*` filenames.
