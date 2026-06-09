/**
 * GameLogic.js - Pure functions for Laser Party game logic
 * No DOM or Phaser dependencies
 */

const GameLogic = (function () {
    /**
     * Create a new game state with a full 10x10 grid
     */
    function createGame() {
        return {
            rows: Array.from({ length: 10 }, (_, i) => i),       // active row indices
            cols: Array.from({ length: 10 }, (_, i) => i),       // active col indices
            multiplier: 1.0,
            round: 0,
            orbRow: null,
            orbCol: null,
            history: [] // array of { axis, index, hit }
        };
    }

    /**
     * Calculate the next multiplier after surviving a laser
     * @param {number} prevMultiplier - previous multiplier
     * @param {string} axis - 'row' or 'col'
     * @param {object} state - current game state (before removal)
     * @returns {number} new multiplier
     */
    function calcNextMultiplier(prevMultiplier, axis, state) {
        const remainingLines = axis === 'row' ? state.rows.length : state.cols.length;
        const deathProb = 1 / remainingLines;
        const base = 1 / (1 - deathProb);
        return prevMultiplier * base * 0.96;
    }

    /**
     * Generate the next laser target (random row or column from remaining)
     * Will not fire at an axis with only 1 line remaining (to prevent grid collapsing to 0)
     * @param {object} state - current game state
     * @returns {{ axis: string, index: number }}
     */
    function generateLaserTarget(state) {
        let axis;
        if (state.rows.length <= 1 && state.cols.length > 1) {
            axis = 'col';
        } else if (state.cols.length <= 1 && state.rows.length > 1) {
            axis = 'row';
        } else {
            axis = Math.random() < 0.5 ? 'row' : 'col';
        }
        const lines = axis === 'row' ? state.rows : state.cols;
        const index = lines[Math.floor(Math.random() * lines.length)];
        return { axis, index };
    }

    /**
     * Generate a full laser sequence (for testing/preview)
     * Returns an array of { axis, index } for each round until grid is 1x1
     * @param {object} state - initial game state
     * @param {number} [seed] - optional seed (not implemented, uses Math.random)
     * @returns {Array<{ axis: string, index: number }>}
     */
    function generateLaserSequence(state) {
        const sequence = [];
        let currentState = JSON.parse(JSON.stringify(state));

        while (currentState.rows.length > 1 || currentState.cols.length > 1) {
            const target = generateLaserTarget(currentState);
            sequence.push(target);

            // Remove the line
            if (target.axis === 'row') {
                currentState.rows = currentState.rows.filter(r => r !== target.index);
            } else {
                currentState.cols = currentState.cols.filter(c => c !== target.index);
            }
        }

        return sequence;
    }

    /**
     * Fire the next laser. Determines hit/miss and returns new state.
     * @param {object} state - current game state (orbRow and orbCol must be set)
     * @returns {{ axis: string, index: number, hit: boolean, newState: object|null }}
     */
    function fireNextLaser(state) {
        const target = generateLaserTarget(state);
        const { axis, index } = target;

        // Check hit
        let hit = false;
        if (axis === 'row' && index === state.orbRow) {
            hit = true;
        } else if (axis === 'col' && index === state.orbCol) {
            hit = true;
        }

        if (hit) {
            return {
                axis,
                index,
                hit: true,
                newState: null
            };
        }

        // Survived - calculate new multiplier before removing line
        const newMultiplier = calcNextMultiplier(state.multiplier, axis, state);

        // Remove the fired line
        let newRows = [...state.rows];
        let newCols = [...state.cols];
        if (axis === 'row') {
            newRows = newRows.filter(r => r !== index);
        } else {
            newCols = newCols.filter(c => c !== index);
        }

        const newState = {
            rows: newRows,
            cols: newCols,
            multiplier: newMultiplier,
            round: state.round + 1,
            orbRow: null,
            orbCol: null,
            history: [...state.history, { axis, index, hit: false }]
        };

        return {
            axis,
            index,
            hit: false,
            newState
        };
    }

    /**
     * Cash out - calculate payout
     * @param {object} state - current game state
     * @param {number} bet - original bet amount
     * @returns {{ payout: number, multiplier: number }}
     */
    function cashOut(state, bet) {
        return {
            payout: bet * state.multiplier,
            multiplier: state.multiplier
        };
    }

    // Export for both browser and Node.js
    const exports = {
        createGame,
        calcNextMultiplier,
        generateLaserTarget,
        generateLaserSequence,
        fireNextLaser,
        cashOut
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports;
    }

    return exports;
})();
