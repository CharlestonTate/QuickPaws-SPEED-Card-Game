// ============================================================
// COMBO SYSTEM
// ============================================================
// Tracks consecutive card plays and provides visual/audio feedback

class ComboSystem {
    constructor() {
        this.playerCombo = 0;      // Current player combo count
        this.lastPlayedBy = null;  // 'player' or 'cpu' - who played last card
        this.lastPlayTime = 0;     // Timestamp of last card played (for timing threshold)
        
        // Combo thresholds and their corresponding sounds
        this.comboSounds = [
            { count: 2, sound: 'combo_1' },
            { count: 3, sound: 'combo_2' },
            { count: 4, sound: 'combo_3' },
            { count: 5, sound: 'combo_4' },
            { count: 6, sound: 'combo_5' }  // 6+ uses combo_5
        ];
        
        // Time threshold settings (in milliseconds)
        // Strict at beginning, more forgiving as combo builds
        // Example progression:
        //   Combo 2: 1.5s window (strict!)
        //   Combo 3: 1.75s window
        //   Combo 5: 2.25s window
        //   Combo 10: 4s window (max, very forgiving)
        this.baseTimeWindow = 1500;        // 1.5 seconds for starting combos
        this.maxTimeWindow = 3000;         // 4 seconds cap for high combos
        this.timeWindowGrowth = 250;       // Add 250ms per combo level
        
        // Visual settings
        this.fadeOpacity = 1;
        this.scale = 1;
    }
    
    // Get the current time window based on combo level
    // Starts strict (1.5s), gets more forgiving as combo builds
    getTimeWindow() {
        if (this.playerCombo <= 1) return this.baseTimeWindow;
        
        // Calculate time window: base + (combo * growth), capped at max
        const calculatedWindow = this.baseTimeWindow + (this.playerCombo * this.timeWindowGrowth);
        return Math.min(calculatedWindow, this.maxTimeWindow);
    }
    
    // Called when player plays a card
    onPlayerPlay() {
        const currentTime = Date.now();
        
        if (this.lastPlayedBy === 'player') {
            // Check if within time window to continue combo
            const timeSinceLastPlay = currentTime - this.lastPlayTime;
            const allowedWindow = this.getTimeWindow();
            
            if (timeSinceLastPlay <= allowedWindow) {
                // Continue combo - played fast enough!
                this.playerCombo++;
            } else {
                // Too slow - combo broken, start fresh
                this.playerCombo = 1;
            }
        } else {
            // Start new combo
            this.playerCombo = 1;
            this.lastPlayedBy = 'player';
        }
        
        // Update last play time
        this.lastPlayTime = currentTime;
        
        // Play sound if combo >= 2
        if (this.playerCombo >= 2) {
            this.playComboSound();
            this.triggerAnimation();
        }
    }
    
    // Called when CPU plays a card
    onCPUPlay() {
        // CPU play breaks player combo
        if (this.lastPlayedBy === 'player' && this.playerCombo >= 2) {
            this.reset();
        }
        this.lastPlayedBy = 'cpu';
    }
    
    // Play the appropriate combo sound based on current combo
    playComboSound() {
        let soundToPlay = null;
        
        // Find the appropriate sound for current combo count
        for (let i = this.comboSounds.length - 1; i >= 0; i--) {
            if (this.playerCombo >= this.comboSounds[i].count) {
                soundToPlay = this.comboSounds[i].sound;
                break;
            }
        }
        
        if (soundToPlay && typeof playSound !== 'undefined') {
            playSound(soundToPlay, { volume: 0.4 }); // Lowered volume
        }
    }
    
    // Trigger visual animation (scale pop)
    triggerAnimation() {
        this.scale = 1;
        this.fadeOpacity = 1;
        
        // Scale pop animation
        anime({
            targets: this,
            scale: [1, 1.3, 1],
            duration: 300,
            easing: 'easeOutCubic'
        });
    }
    
    // Reset combo (called when combo is broken or game ends)
    reset() {
        this.playerCombo = 0;
        this.lastPlayedBy = null;
        this.lastPlayTime = 0;
        this.fadeOpacity = 0;
        this.scale = 1;
    }
    
    // Get current combo count (for display)
    getComboCount() {
        return this.playerCombo >= 2 ? this.playerCombo : 0;
    }
    
    // Check if combo is active
    isActive() {
        return this.playerCombo >= 2;
    }
    
    // Draw combo counter on canvas
    draw(ctx) {
        if (!this.isActive()) return;
        
        // Position: above player's draw pile
        const drawPilePos = getPlayerDrawPilePosition();
        const x = drawPilePos.x + CARD_WIDTH / 2;
        const y = drawPilePos.y - 30;
        
        ctx.save();
        
        // Apply scale and fade
        ctx.globalAlpha = this.fadeOpacity;
        ctx.translate(x, y);
        ctx.scale(this.scale, this.scale);
        ctx.translate(-x, -y);
        
        // Draw combo text (minimal black text)
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const comboText = `${this.playerCombo}x`;
        
        // White outline for visibility
        ctx.strokeText(comboText, x, y);
        // Black text
        ctx.fillText(comboText, x, y);
        
        ctx.restore();
    }
}

// Create global instance
const comboSystem = new ComboSystem();

