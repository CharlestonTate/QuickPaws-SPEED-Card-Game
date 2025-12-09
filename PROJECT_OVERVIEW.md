## Project Overview

Prof: Knisely
Student: Tate Singleton
Date: 12/7/2025

### Core Gameplay (8)
- Real-time Speed-style card play with two center piles.
- Wrap-around rules (K-A) for valid moves.
- Deadlock detection that flips center piles automatically.
- New cinematic intro dealing sequence before each match
- Main menu, credits, and splash screen flow.
- New game lifecycle with proper cleanup of timeouts and animations.
- Placement mode that lets players confirm pile choice.
- Game over state with win messaging.

### Input & Controls (6)
- Mouse drag-and-drop for playing cards.
- Mouse reordering with hitbox-based insert detection.
- Keyboard navigation with arrow keys for card selection and draw pile cycling.
- Z/Space placement flow plus X for sort mode
- Keyboard vs mouse mode auto-switching on movement.
- Cursor hides in keyboard mode and shows in mouse mode.

### UI / UX & Visuals (6)
- Canvas-only rendering (no DOM cards).
- Custom cursors: idle and grab.
- Placement-mode hovering card drawn offset from pile.
- Countdown overlay (3, 2, 1, FLIP) in black text with white outline.
- CPU hand stays hidden; player hand hidden until dealt.
- Loading screen overlay with spinner for transitions.

### Audio (6)
- HTML5 Audio pooling for low-latency effects.
- Shoosh SFX standardized to volume 1.0.
- Bump/invalid-play shake sound at lower volume.
- Office splash music with fade in/out.
- sortLong used only during draw-pile distribution stage.
- Woah trigger on credits button click.

### Animations (6)
- Anime.js powered card movement, plop, and spin draw.
- Shift animation for reordering hand cards.
- Shake animation on invalid placement tries.
- Smooth keyboard cursor slide annimation.
- Cinematic intro staged timelines with guarded timeouts.
- Countdown scale/opacity beats synced to bump SFX.

### AI & Game Logic (6)
- CPU interval loop with pending-play tracking.
- CPU play cancellation when piles change.
- Game state guards on all async callbacks.
- CPU hand rendering hidden unless playing to pile.
- Deadlock check after draws and invalid drops.
- Flip check counter to avoid runaway loops.

### Tech Stack (6)
- Vanilla JS with canvas 2D context.
- anime.js for tweening.
- Plain CSS for layout and cursor styling.
- HTML5 Audio API with manual pooling.
- No external build step; runs in-browser directly.
- Minimal devtools hooks for tracing animations.

### Back-end / Implementation Notes (6)
- State reset in game.stop clears intervals, timeouts, animations, and piles.
- Intro timeouts tracked and cleared when leaving or starting new games.
- Hands stay hidden ('handsRevealed' flag) until the hand-deal completes.
- Reorder insert logic uses widened hitbox for forgiving drag behavour.
- Audio preload helper with graceful fallback when play promises fail.
- Placement mode logic enforces confirmation, shake on invalid pile, and bump SFX.
