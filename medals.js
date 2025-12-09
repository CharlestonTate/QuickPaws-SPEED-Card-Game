// ============================================================
// MEDALS & DIFFICULTY SYSTEM
// ============================================================

const DIFFICULTIES = {
    BRONZE: {
        id: 'bronze',
        name: 'Easy',
        displayName: 'Bronze',
        cpuSpeed: 800,           // CPU plays every 800ms
        medalSound: 'bronze_medal',
        medalImages: ['art/bronze1.png', 'art/bronze2.png'],
        nextDifficulty: 'silver'
    },
    SILVER: {
        id: 'silver',
        name: 'Medium',
        displayName: 'Silver',
        cpuSpeed: 550,           // CPU plays every 550ms (faster!)
        medalSound: 'silver_medal',
        medalImages: ['art/silver1.png', 'art/silver2.png'],
        nextDifficulty: 'gold'
    },
    GOLD: {
        id: 'gold',
        name: 'Hard',
        displayName: 'Gold',
        cpuSpeed: 350,           // CPU plays every 350ms (much faster!)
        medalSound: 'gold_medal',
        medalImages: ['art/gold1.png', 'art/gold2.png'],
        nextDifficulty: 'platinum'
    },
    PLATINUM: {
        id: 'platinum',
        name: 'Meow',
        displayName: 'Platinum',
        cpuSpeed: 200,           // CPU plays every 200ms (blazing fast!)
        medalSound: 'platinum_medal',
        medalImages: ['art/plat1.png', 'art/plat2.png'],
        nextDifficulty: null     // Final difficulty
    }
};

class DifficultyManager {
    constructor() {
        this.currentDifficulty = 'bronze'; // Start with bronze (easy)
        this.medalImages = new Map();      // Preloaded images
        
        // Preload all medal images
        this.preloadMedalImages();
    }
    
    // Preload medal images
    preloadMedalImages() {
        Object.values(DIFFICULTIES).forEach(difficulty => {
            difficulty.medalImages.forEach(imagePath => {
                if (!this.medalImages.has(imagePath)) {
                    const img = new Image();
                    img.src = imagePath;
                    this.medalImages.set(imagePath, img);
                }
            });
        });
    }
    
    // Get current difficulty configuration
    getCurrentDifficulty() {
        return DIFFICULTIES[this.currentDifficulty.toUpperCase()];
    }
    
    // Get CPU speed for current difficulty
    getCPUSpeed() {
        return this.getCurrentDifficulty().cpuSpeed;
    }
    
    // Advance to next difficulty
    advanceToNext() {
        const current = this.getCurrentDifficulty();
        if (current.nextDifficulty) {
            this.currentDifficulty = current.nextDifficulty;
            return true; // Advanced to next
        }
        return false; // Already at max difficulty
    }
    
    // Reset to bronze (easy)
    reset() {
        this.currentDifficulty = 'bronze';
    }
    
    // Check if at final difficulty
    isFinalDifficulty() {
        return this.getCurrentDifficulty().nextDifficulty === null;
    }
    
    // Get medal image (alternating between 1 and 2)
    getMedalImage(frameIndex) {
        const difficulty = this.getCurrentDifficulty();
        const imageIndex = frameIndex % 2; // Alternate between 0 and 1
        const imagePath = difficulty.medalImages[imageIndex];
        return this.medalImages.get(imagePath);
    }
    
    // Get medal sound name
    getMedalSound() {
        return this.getCurrentDifficulty().medalSound;
    }
}

// Create global instance
const difficultyManager = new DifficultyManager();

