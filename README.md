# ☠ LASER PARTY

A Phaser 3 grid betting game where you place an orb on a 10×10 grid and survive laser strikes to multiply your ETH.

**Live demo:** https://phaser-assignment.vercel.app/  
**GitHub:** https://github.com/MasterInDisguise-hub/Phaser-Assignment

## How to Play

1. Enter your ETH bet and click **Place Bet**
2. Click any cell on the red grid to place your white orb
3. After ~1 second, a laser fires along a random row or column
4. **HIT** → BUST! You lose your bet
5. **MISS** → The fired row/col is permanently removed, multiplier increases
6. After surviving: **CASH OUT** to collect winnings, or pick a new cell for higher multiplier

## Multiplier Formula

```
death_prob = 1 / remaining_lines_on_fired_axis
base = 1 / (1 - death_prob)
multiplier = prev_multiplier × base × 0.96
```

## Project Structure

```
index.html              - HTML shell + UI elements + Phaser bootstrap
src/GameLogic.js        - Pure functions (no DOM/Phaser)
src/GameScene.js        - Phaser Scene (rendering + animations)
tests/GameLogic.test.js - Unit tests
```

## Running

Open `index.html` in a browser (serve via local HTTP server for best results):

```bash
npx http-server . -p 8080 -o
```

## Tests

```bash
node tests/GameLogic.test.js
```

## Exported Functions (GameLogic)

- `createGame()` — Initialize a fresh 10×10 game state
- `fireNextLaser(state)` — Fire a random laser, returns hit/miss + new state
- `cashOut(state, bet)` — Calculate payout
- `calcNextMultiplier(prev, axis, state)` — Compute next multiplier
- `generateLaserSequence(state)` — Preview full random sequence (for testing)
