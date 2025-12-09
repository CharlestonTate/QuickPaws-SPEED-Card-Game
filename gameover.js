// ============================================================
// GAME OVER SCREEN (Win/Lose handling)
// ============================================================

class GameOverScreen {
    constructor() {
        this.isActive = false;
        this.isWin = false;
        this.message = '';
        this.fadeState = {
            opacity: 0
        };
        this.fadeInDuration = 500;
        this.startTime = 0;
        this.medalFrameIndex = 0;      // For alternating medal images
        this.lastFrameTime = 0;        // For timing frame switches
        
        // Buttons
        this.continueButton = {
            text: 'Continue',
            width: 180,
            height: 50,
            x: 0,
            y: 0
        };
        this.menuButton = {
            text: 'Main Menu',
            width: 180,
            height: 50,
            x: 0,
            y: 0
        };
    }
    
    // Show the game over screen
    show(isWin) {
        this.isActive = true;
        this.isWin = isWin;
        this.fadeState.opacity = 0;
        this.startTime = Date.now();
        this.lastFrameTime = Date.now();
        this.medalFrameIndex = 0;
        
        if (isWin) {
            // Player wins - show medal and difficulty name
            const difficulty = typeof difficultyManager !== 'undefined' 
                ? difficultyManager.getCurrentDifficulty() 
                : { displayName: 'Bronze' };
            this.message = `${difficulty.displayName} Complete!`;
            
            // Check if at final difficulty
            const isFinalDifficulty = typeof difficultyManager !== 'undefined' && difficultyManager.isFinalDifficulty();
            
            if (isFinalDifficulty) {
                // Center menu button (no continue button)
                this.menuButton.x = (canvas.width - this.menuButton.width) / 2;
                this.menuButton.y = (canvas.height / 2) + 150;
            } else {
                // Position buttons side by side
                const buttonGap = 20;
                const totalWidth = this.continueButton.width + buttonGap + this.menuButton.width;
                const startX = (canvas.width - totalWidth) / 2;
                
                this.continueButton.x = startX;
                this.continueButton.y = (canvas.height / 2) + 150;
                
                this.menuButton.x = startX + this.continueButton.width + buttonGap;
                this.menuButton.y = (canvas.height / 2) + 150;
            }
            
            // Play medal sound
            if (typeof playSound !== 'undefined' && typeof difficultyManager !== 'undefined') {
                const medalSound = difficultyManager.getMedalSound();
                playSound(medalSound, { volume: 0.7 });
            }
        } else {
            // Player loses - simple message
            this.message = 'CPU Wins!';
            
            // Position single menu button
            this.menuButton.x = (canvas.width - this.menuButton.width) / 2;
            this.menuButton.y = (canvas.height / 2) + 60;
            
            // Play loss sound
            if (typeof playSound !== 'undefined') {
                playSound('bump', { volume: 0.5 });
            }
        }
        
        // Fade in the overlay
        this.fadeIn();
    }
    
    // Fade in animation
    fadeIn() {
        anime({
            targets: this.fadeState,
            opacity: 1,
            duration: this.fadeInDuration,
            easing: 'easeOutCubic'
        });
    }
    
    // Continue to next difficulty
    continueToNext() {
        if (!this.isActive || !this.isWin) return;
        
        this.isActive = false;
        
        // Advance difficulty
        if (typeof difficultyManager !== 'undefined') {
            difficultyManager.advanceToNext();
        }
        
        // Stop current game
        game.stop();
        
        // Reset UI state
        this.resetUIState();
        
        // Start new game at new difficulty
        gameState = 'playing';
        game.start();
    }
    
    // Return to main menu
    returnToMenu() {
        if (!this.isActive) return;
        
        this.isActive = false;
        
        // Reset difficulty to bronze (easy)
        if (typeof difficultyManager !== 'undefined') {
            difficultyManager.reset();
        }
        
        // Stop the game completely
        game.stop();
        
        // Reset UI state
        this.resetUIState();
        
        // Go to main menu
        gameState = 'mainmenu';
        if (typeof mainMenu !== 'undefined') {
            mainMenu.show();
        }
    }
    
    // Helper to reset UI state
    resetUIState() {
        if (typeof draggedCard !== 'undefined') {
            draggedCard = null;
        }
        if (typeof draggedCardOriginalPos !== 'undefined') {
            draggedCardOriginalPos = null;
        }
        if (typeof isCardReturning !== 'undefined') {
            isCardReturning = false;
        }
        if (typeof isCardPlopping !== 'undefined') {
            isCardPlopping = false;
        }
        if (typeof isReordering !== 'undefined') {
            isReordering = false;
        }
        if (typeof canvas !== 'undefined') {
            canvas.style.cursor = '';
            canvas.classList.remove('grabbing');
        }
        
        // Reset keyboard controller
        if (typeof resetKeyboardController !== 'undefined') {
            resetKeyboardController();
        }
    }
    
    // Handle click events
    handleClick(x, y) {
        if (!this.isActive) return;
        
        if (this.isWin) {
            // Check continue button (only if not at final difficulty)
            const isFinalDifficulty = typeof difficultyManager !== 'undefined' && difficultyManager.isFinalDifficulty();
            
            if (!isFinalDifficulty && isPointInRect(x, y, this.continueButton.x, this.continueButton.y, 
                             this.continueButton.width, this.continueButton.height)) {
                if (typeof playSound !== 'undefined') {
                    playSound('bump', { volume: 0.5 });
                }
                this.continueToNext();
                return;
            }
            
            // Check menu button
            if (isPointInRect(x, y, this.menuButton.x, this.menuButton.y, 
                             this.menuButton.width, this.menuButton.height)) {
                if (typeof playSound !== 'undefined') {
                    playSound('bump', { volume: 0.5 });
                }
                this.returnToMenu();
                return;
            }
        } else {
            // Only menu button on loss
            if (isPointInRect(x, y, this.menuButton.x, this.menuButton.y, 
                             this.menuButton.width, this.menuButton.height)) {
                if (typeof playSound !== 'undefined') {
                    playSound('bump', { volume: 0.5 });
                }
                this.returnToMenu();
                return;
            }
        }
    }
    
    // Draw the game over screen
    draw(ctx, mouseX, mouseY) {
        if (!this.isActive || this.fadeState.opacity <= 0) return;
        
        // Update medal frame animation (switch every 0.5 seconds)
        const now = Date.now();
        if (now - this.lastFrameTime >= 500) {
            this.medalFrameIndex = (this.medalFrameIndex + 1) % 2;
            this.lastFrameTime = now;
        }
        
        ctx.save();
        
        // Dark overlay
        ctx.globalAlpha = this.fadeState.opacity * 0.8;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Reset alpha for content
        ctx.globalAlpha = this.fadeState.opacity;
        
        if (this.isWin) {
            // WIN SCREEN - Show medal
            
            // Draw medal image (alternating)
            if (typeof difficultyManager !== 'undefined') {
                const medalImg = difficultyManager.getMedalImage(this.medalFrameIndex);
                if (medalImg && medalImg.complete) {
                    const medalSize = 200;
                    const medalX = canvas.width / 2 - medalSize / 2;
                    const medalY = canvas.height / 2 - 120;
                    ctx.drawImage(medalImg, medalX, medalY, medalSize, medalSize);
                }
            }
            
            // Draw message above medal
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.font = 'bold 42px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeText(this.message, canvas.width / 2, canvas.height / 2 - 200);
            ctx.fillText(this.message, canvas.width / 2, canvas.height / 2 - 200);
            
            // Draw Continue button (only if not at final difficulty)
            const isFinalDifficulty = typeof difficultyManager !== 'undefined' && difficultyManager.isFinalDifficulty();
            
            if (!isFinalDifficulty) {
                const continueHovering = isPointInRect(mouseX, mouseY, this.continueButton.x, this.continueButton.y, 
                                                       this.continueButton.width, this.continueButton.height);
                ctx.fillStyle = continueHovering ? '#4caf50' : '#2e7d32';
                drawRoundedRect(this.continueButton.x, this.continueButton.y, 
                              this.continueButton.width, this.continueButton.height, 8);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 20px Arial';
                ctx.fillText(this.continueButton.text, 
                           this.continueButton.x + this.continueButton.width / 2, 
                           this.continueButton.y + this.continueButton.height / 2);
            }
            
            // Draw Main Menu button
            const menuHovering = isPointInRect(mouseX, mouseY, this.menuButton.x, this.menuButton.y, 
                                              this.menuButton.width, this.menuButton.height);
            ctx.fillStyle = menuHovering ? '#555' : '#333';
            drawRoundedRect(this.menuButton.x, this.menuButton.y, 
                          this.menuButton.width, this.menuButton.height, 8);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px Arial';
            ctx.fillText(this.menuButton.text, 
                       this.menuButton.x + this.menuButton.width / 2, 
                       this.menuButton.y + this.menuButton.height / 2);
            
        } else {
            // LOSS SCREEN - Simple box
            const boxWidth = 450;
            const boxHeight = 200;
            const boxX = canvas.width / 2 - boxWidth / 2;
            const boxY = canvas.height / 2 - boxHeight / 2;
            
            ctx.fillStyle = '#ffebee';
            drawRoundedRect(boxX, boxY, boxWidth, boxHeight, 15);
            ctx.fill();
            ctx.strokeStyle = '#f44336';
            ctx.lineWidth = 4;
            ctx.stroke();
            
            ctx.fillStyle = '#000';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.message, canvas.width / 2, canvas.height / 2 - 20);
            
            // Main Menu button
            const menuHovering = isPointInRect(mouseX, mouseY, this.menuButton.x, this.menuButton.y, 
                                              this.menuButton.width, this.menuButton.height);
            ctx.fillStyle = menuHovering ? '#555' : '#333';
            drawRoundedRect(this.menuButton.x, this.menuButton.y, 
                          this.menuButton.width, this.menuButton.height, 8);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 18px Arial';
            ctx.fillText(this.menuButton.text, 
                       this.menuButton.x + this.menuButton.width / 2, 
                       this.menuButton.y + this.menuButton.height / 2);
        }
        
        ctx.restore();
    }
    
    // Clean up when closing
    hide() {
        this.isActive = false;
    }
}

// Create global instance
const gameOverScreen = new GameOverScreen();

