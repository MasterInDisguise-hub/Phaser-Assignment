/**
 * GameScene.js - Phaser 3 Scene for Laser Party
 * Handles all rendering, grid drawing, animations
 */

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        this.gameState = null;
        this.clicksEnabled = false;
        this.gridPadding = 40;
        this.gamePhase = 'betting'; // betting | picking | laser | result
        this.dynamicObjects = []; // track all created game objects for cleanup

        // Init SoundManager once (survives scene restart via global)
        if (!window._soundManager) {
            window._soundManager = new SoundManager();
        }
        this.sound_mgr = window._soundManager;
    }

    create() {
        this.gridGraphics = this.add.graphics();
        this.laserGraphics = this.add.graphics();
        this.effectsGraphics = this.add.graphics();

        // Handle resize
        this.scale.on('resize', this.handleResize, this);

        // Input handling — also resumes AudioContext on first interaction
        this.input.on('pointerdown', this.handleClick, this);
    }

    handleResize(gameSize) {
        if (this.gameState) {
            this.drawGrid();
        }
    }

    getGridBounds() {
        const w = this.scale.width;
        const h = this.scale.height;
        const padding = this.gridPadding;

        const availW = w - padding * 2;
        const availH = h - padding * 2;

        const rows = this.gameState ? this.gameState.rows.length : 10;
        const cols = this.gameState ? this.gameState.cols.length : 10;

        const cellSize = Math.min(availW / cols, availH / rows);
        const gridW = cellSize * cols;
        const gridH = cellSize * rows;

        const offsetX = (w - gridW) / 2;
        const offsetY = (h - gridH) / 2;

        return { offsetX, offsetY, cellSize, gridW, gridH, rows, cols };
    }

    drawGrid() {
        this.gridGraphics.clear();

        if (!this.gameState) return;

        const { offsetX, offsetY, cellSize, rows, cols } = this.getGridBounds();

        // Draw cells
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = offsetX + c * cellSize;
                const y = offsetY + r * cellSize;

                // Cell background
                this.gridGraphics.fillStyle(0x1a0000, 1);
                this.gridGraphics.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

                // Cell border
                this.gridGraphics.lineStyle(1, 0xff0033, 0.6);
                this.gridGraphics.strokeRect(x, y, cellSize, cellSize);
            }
        }

        // Draw orb if placed
        if (this.gameState.orbRow !== null && this.gameState.orbCol !== null) {
            const orbGridRow = this.gameState.rows.indexOf(this.gameState.orbRow);
            const orbGridCol = this.gameState.cols.indexOf(this.gameState.orbCol);

            if (orbGridRow !== -1 && orbGridCol !== -1) {
                const orbX = offsetX + orbGridCol * cellSize + cellSize / 2;
                const orbY = offsetY + orbGridRow * cellSize + cellSize / 2;
                const radius = cellSize * 0.3;

                this.gridGraphics.fillStyle(0xffffff, 1);
                this.gridGraphics.fillCircle(orbX, orbY, radius);

                // Glow effect
                this.gridGraphics.fillStyle(0xffffff, 0.2);
                this.gridGraphics.fillCircle(orbX, orbY, radius * 1.4);
            }
        }
    }

    startPickPhase(state) {
        this.gameState = state;
        this.gamePhase = 'picking';
        this.drawGrid();
        this.enableClicks();
    }

    enableClicks() {
        this.clicksEnabled = true;
    }

    disableClicks() {
        this.clicksEnabled = false;
    }

    handleClick(pointer) {
        // Resume AudioContext on any click (browser autoplay policy)
        this.sound_mgr.resume();

        if (!this.clicksEnabled || !this.gameState) return;

        const { offsetX, offsetY, cellSize, rows, cols } = this.getGridBounds();

        const gridX = pointer.x - offsetX;
        const gridY = pointer.y - offsetY;

        if (gridX < 0 || gridY < 0) return;

        const gridCol = Math.floor(gridX / cellSize);
        const gridRow = Math.floor(gridY / cellSize);

        if (gridRow < 0 || gridRow >= rows || gridCol < 0 || gridCol >= cols) return;

        // Map grid position to actual row/col index
        const actualRow = this.gameState.rows[gridRow];
        const actualCol = this.gameState.cols[gridCol];

        this.clicksEnabled = false;
        this.gamePhase = 'laser';
        this.gameState.orbRow = actualRow;
        this.gameState.orbCol = actualCol;
        this.drawGrid();

        // Play click sound
        this.sound_mgr.playClick();

        // Notify the main UI
        if (typeof onCellPicked === 'function') {
            onCellPicked(actualRow, actualCol);
        }
    }

    /** Play laser charge sound (called from main script during warning phase) */
    playLaserCharge() {
        this.sound_mgr.playLaserCharge();
    }

    animateLaser(axis, index, hit, callback) {
        const { offsetX, offsetY, cellSize, rows, cols } = this.getGridBounds();
        const gridW = cellSize * cols;
        const gridH = cellSize * rows;

        this.laserGraphics.clear();

        let startX, startY, endX, endY;

        if (axis === 'row') {
            // Horizontal laser across the row
            const gridRow = this.gameState.rows.indexOf(index);
            if (gridRow === -1) { callback(); return; }
            const y = offsetY + gridRow * cellSize + cellSize / 2;
            startX = offsetX;
            startY = y;
            endX = offsetX + gridW;
            endY = y;
        } else {
            // Vertical laser down the column
            const gridCol = this.gameState.cols.indexOf(index);
            if (gridCol === -1) { callback(); return; }
            const x = offsetX + gridCol * cellSize + cellSize / 2;
            startX = x;
            startY = offsetY;
            endX = x;
            endY = offsetY + gridH;
        }

        // Play laser fire sound
        this.sound_mgr.playLaserFire();

        // Animate sweep
        const duration = 400;
        const laserWidth = cellSize * 0.8;

        let progress = { t: 0 };

        this.tweens.add({
            targets: progress,
            t: 1,
            duration: duration,
            ease: 'Quad.easeIn',
            onUpdate: () => {
                this.laserGraphics.clear();

                if (axis === 'row') {
                    // Horizontal sweep left to right
                    const currentX = startX + (endX - startX) * progress.t;
                    this.laserGraphics.fillStyle(0xff0033, 0.8);
                    this.laserGraphics.fillRect(startX, startY - laserWidth / 2, currentX - startX, laserWidth);
                    // Bright leading edge
                    this.laserGraphics.fillStyle(0xff3333, 1);
                    this.laserGraphics.fillRect(currentX - 4, startY - laserWidth / 2, 4, laserWidth);
                } else {
                    // Vertical sweep top to bottom
                    const currentY = startY + (endY - startY) * progress.t;
                    this.laserGraphics.fillStyle(0xff0033, 0.8);
                    this.laserGraphics.fillRect(startX - laserWidth / 2, startY, laserWidth, currentY - startY);
                    // Bright leading edge
                    this.laserGraphics.fillStyle(0xff3333, 1);
                    this.laserGraphics.fillRect(startX - laserWidth / 2, currentY - 4, laserWidth, 4);
                }
            },
            onComplete: () => {
                // Flash the full line
                this.laserGraphics.clear();

                if (axis === 'row') {
                    this.laserGraphics.fillStyle(0xff0033, 0.9);
                    this.laserGraphics.fillRect(startX, startY - laserWidth / 2, endX - startX, laserWidth);
                } else {
                    this.laserGraphics.fillStyle(0xff0033, 0.9);
                    this.laserGraphics.fillRect(startX - laserWidth / 2, startY, laserWidth, endY - startY);
                }

                // Fade out
                this.time.delayedCall(300, () => {
                    this.tweens.add({
                        targets: { alpha: 1 },
                        alpha: 0,
                        duration: 300,
                        onUpdate: (tween) => {
                            const a = 1 - tween.progress;
                            this.laserGraphics.clear();
                            if (axis === 'row') {
                                this.laserGraphics.fillStyle(0xff0033, a * 0.9);
                                this.laserGraphics.fillRect(startX, startY - laserWidth / 2, endX - startX, laserWidth);
                            } else {
                                this.laserGraphics.fillStyle(0xff0033, a * 0.9);
                                this.laserGraphics.fillRect(startX - laserWidth / 2, startY, laserWidth, endY - startY);
                            }
                        },
                        onComplete: () => {
                            this.laserGraphics.clear();
                            callback();
                        }
                    });
                });
            }
        });
    }

    showBustEffect(row, col) {
        const { offsetX, offsetY, cellSize } = this.getGridBounds();
        const gridRow = this.gameState ? this.gameState.rows.indexOf(row) : -1;
        const gridCol = this.gameState ? this.gameState.cols.indexOf(col) : -1;

        if (gridRow === -1 || gridCol === -1) return;

        const x = offsetX + gridCol * cellSize + cellSize / 2;
        const y = offsetY + gridRow * cellSize + cellSize / 2;

        // Play bust sounds
        this.sound_mgr.playBust();
        setTimeout(() => { this.sound_mgr.playBustSkull(); }, 300);

        // Skull overlay on cell
        const skull = this.add.text(x, y, '☠', {
            fontSize: cellSize * 0.7 + 'px',
            color: '#ff0033'
        }).setOrigin(0.5);
        this.dynamicObjects.push(skull);

        // Pulse animation
        this.tweens.add({
            targets: skull,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 200,
            yoyo: true,
            repeat: 3
        });

        // Screen shake
        this.cameras.main.shake(500, 0.02);

        this.gamePhase = 'result';
    }

    showCashoutEffect(row, col, payout) {
        const { offsetX, offsetY, cellSize } = this.getGridBounds();
        const gridRow = this.gameState ? this.gameState.rows.indexOf(row) : -1;
        const gridCol = this.gameState ? this.gameState.cols.indexOf(col) : -1;

        if (gridRow === -1 || gridCol === -1) return;

        const x = offsetX + gridCol * cellSize + cellSize / 2;
        const y = offsetY + gridRow * cellSize + cellSize / 2;

        // Play cashout sound
        this.sound_mgr.playCashout();

        // Green flash on cell
        this.effectsGraphics.clear();
        this.effectsGraphics.fillStyle(0x00ff00, 0.5);
        this.effectsGraphics.fillRect(
            offsetX + gridCol * cellSize,
            offsetY + gridRow * cellSize,
            cellSize, cellSize
        );

        // Floating text
        const text = this.add.text(x, y, '+' + payout.toFixed(4) + ' ETH', {
            fontSize: '18px',
            color: '#00ff00',
            fontFamily: 'Courier New',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.dynamicObjects.push(text);

        this.tweens.add({
            targets: text,
            y: y - 60,
            alpha: 0,
            duration: 1200,
            ease: 'Quad.easeOut',
            onComplete: () => {
                text.destroy();
                this.dynamicObjects = this.dynamicObjects.filter(o => o !== text);
            }
        });

        // Camera flash green
        this.cameras.main.flash(300, 0, 255, 0, false);

        this.gamePhase = 'result';
    }

    /** Play survive sound (called externally after laser miss confirmed) */
    playSurviveSound() {
        this.sound_mgr.playSurvive();
    }

    updateGridAfterSurvive(newState) {
        this.gameState = newState;
        this.gamePhase = 'picking';
        this.drawGrid();
    }

    resetGrid() {
        // Destroy all dynamic game objects (skulls, floating text, etc.)
        for (const obj of this.dynamicObjects) {
            if (obj && obj.destroy) {
                obj.destroy();
            }
        }
        this.dynamicObjects = [];

        // Clear all graphics
        if (this.gridGraphics) this.gridGraphics.clear();
        if (this.laserGraphics) this.laserGraphics.clear();
        if (this.effectsGraphics) this.effectsGraphics.clear();

        // Kill all active tweens
        this.tweens.killAll();

        // Reset state
        this.gameState = null;
        this.clicksEnabled = false;
        this.gamePhase = 'betting';
    }
}
