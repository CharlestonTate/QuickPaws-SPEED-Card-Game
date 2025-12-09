// ============================================================
// SPLASH SCREEN (Opening developer credit)
// ============================================================

const splashScreen = {
    fadeState: {
        opacity: 0
    },
    startTime: 0,
    
    // ============================================================
    // TIMING CONFIGURATION - ADJUST THESE VALUES
    // ============================================================
    whiteScreenDuration: 1200, // ⬅️ WHITE SCREEN: How long to show white before text appears (in milliseconds)
    fadeInDuration: 600,      // Text fade in duration
    displayDuration: 2500,    // Show text at full opacity for 2.5 seconds
    fadeOutDuration: 800,     // Fade out duration (text AND music)
    // ============================================================
    
    hasBeenClicked: false,
    isLoaded: false,
    audioElement: null,
    defaultMessage: 'a game by c.t. singleton : )',
    currentMessage: 'a game by c.t. singleton : )',
    
    // Easter egg messages
    easterEggMessages: [
        "this game isn't made for her.",
        "so glad game devs still add these in",
        "can't play speed with anyone else",
        "this game was difficult to make",
        "meow"
    ],
    
    show() {
        this.hasBeenClicked = false;
        this.isLoaded = false; // Will become true after white screen delay
        this.currentMessage = this.defaultMessage;
        this.fadeState.opacity = 0;
        
        // Play the music immediately (will buffer if needed)
        if (typeof playSound !== 'undefined') {
            this.audioElement = playSound('office', { volume: 0.8 });
        }
        
        // Wait for white screen duration, then start fade in
        setTimeout(() => {
            this.isLoaded = true;
            this.fadeIn();
        }, this.whiteScreenDuration);
    },
    
    fadeIn() {
        this.startTime = Date.now();
        
        // Fade in animation
        anime({
            targets: this.fadeState,
            opacity: 1,
            duration: this.fadeInDuration,
            easing: 'easeOutQuad',
            complete: () => {
                // Wait for display duration, then fade out
                setTimeout(() => {
                    this.fadeOut();
                }, this.displayDuration);
            }
        });
    },
    
    fadeOut() {
        // Fade out text
        anime({
            targets: this.fadeState,
            opacity: 0,
            duration: this.fadeOutDuration,
            easing: 'easeInQuad',
            complete: () => {
                // Transition to main menu
                gameState = 'mainmenu';
                if (typeof mainMenu !== 'undefined') {
                    mainMenu.show();
                }
            }
        });
        
        // Fade out music at the same time
        if (this.audioElement && typeof fadeOutAudio !== 'undefined') {
            fadeOutAudio(this.audioElement, this.fadeOutDuration);
        }
    },
    
    handleClick(mouseX, mouseY) {
        // Only allow click after text is visible and only once
        if (!this.hasBeenClicked && this.isLoaded && this.fadeState.opacity > 0.5) {
            // Check if click is on the text itself
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            // Create a temporary canvas context to measure text
            ctx.font = '36px Arial';
            const textMetrics = ctx.measureText(this.currentMessage);
            const textWidth = textMetrics.width;
            const textHeight = 36; // Approximate height based on font size
            
            // Calculate text bounds (centered)
            const textLeft = centerX - textWidth / 2;
            const textRight = centerX + textWidth / 2;
            const textTop = centerY - textHeight / 2;
            const textBottom = centerY + textHeight / 2;
            
            // Check if mouse is within text bounds
            if (mouseX >= textLeft && mouseX <= textRight && 
                mouseY >= textTop && mouseY <= textBottom) {
                this.hasBeenClicked = true;
                
                // Play meow sound
                if (typeof playSound !== 'undefined') {
                    playSound('shortmeow', { volume: 0.7 });
                }
                
                // Pick random easter egg message
                const randomIndex = Math.floor(Math.random() * this.easterEggMessages.length);
                this.currentMessage = this.easterEggMessages[randomIndex];
            }
        }
    },
    
    draw(ctx) {
        // White background (always shown, even while loading)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Black text with fade opacity (only shown after audio loads)
        if (this.isLoaded) {
            ctx.save();
            ctx.globalAlpha = this.fadeState.opacity;
            ctx.fillStyle = '#000000';
            ctx.font = '36px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.currentMessage, canvas.width / 2, canvas.height / 2);
            ctx.restore();
        }
    }
};

