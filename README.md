# Tower Defense

A fast, canvas-based tower defense game built with React + Vite. Place towers, survive escalating waves, and manage upgrades to hold the line.

**Features**
- Three tower classes with distinct roles: Blaster, Frost, and Cannon
- Wave-based enemy scaling with mixed enemy types
- Upgrade and sell mechanics for tactical re-positioning
- Hover and select feedback with range visualization
- Sound effects with mute control

**Controls**
- Click a tower in the Arsenal to arm placement
- Click the map to place the selected tower
- Click a placed tower to open its upgrade/sell panel
- `Pause` button to freeze the action, `Restart` to reset the run
- `Mute` button to toggle sound

**Getting Started**
1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`

The dev server runs on `http://localhost:3000`.

**Build**
- Production build: `npm run build`
- Preview build: `npm run preview`

**Project Structure**
- `src/App.tsx` UI shell, HUD, and input wiring
- `src/game/Engine.ts` core game loop, waves, enemies, and combat rules
- `src/game/Renderer.ts` canvas drawing and visual effects
- `src/game/constants.ts` balance values and map path
- `src/game/types.ts` shared game types
- `src/game/SoundManager.ts` audio cues

**Notes**
- `.env.example` is included for reference, but the current game does not require any environment variables.
