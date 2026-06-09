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

## Resources & Tools Used

### AI Tools
- **Claude (Anthropic)** — game mechanic design, GameLogic.js architecture, unit test structure, multiplier formula implementation
- **Kiro AI** — code generation, bug fixes, UI iterations

### References
- [death.fun/laser](https://death.fun/laser) — reference game (mechanic analysis)
- [Phaser 3 Docs](https://newdocs.phaser.io/docs/3.60.0) — Phaser 3 API reference
- [Phaser 3 CDN](https://cdnjs.cloudflare.com/ajax/libs/phaser/3.60.0/phaser.min.js) — via cdnjs
- [Mulberry32 PRNG](https://github.com/bryc/code/blob/master/jshash/PRNGs.md) — seeded RNG for provably fair sequence
- [Web Audio API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — procedural sound effects
- [Vercel Docs](https://vercel.com/docs) — deployment

## Time Spent

~60 minutes total:
- 10 min — reference game analysis + mechanic breakdown
- 15 min — GameLogic.js + unit tests
- 25 min — Phaser UI, animations, sounds, bug fixes
- 10 min — responsive fixes, polish, deployment
