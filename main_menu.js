// ============================================================
// MAIN MENU SYSTEM
// ============================================================

class MenuButton {
    constructor(text, x, y, width, height, action) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.action = action;
        this.animState = {
            x: x,
            y: y,
            scale: 0,
            opacity: 0
        };
        this.isHovering = false;
        this.isAnimating = false;
    }
    
    // Animate button entrance (uses animation manager)
    animateIn(delay = 0) {
        this.isAnimating = true;
        // Initialize state
        this.animState.scale = 0;
        this.animState.opacity = 0;
        
        setTimeout(() => {
            if (typeof animManager !== 'undefined' && animManager.animateUI) {
                // Use animation manager
                animManager.animateUI(this.animState, {
                    scale: [0, 1.1, 1],
                    opacity: 1,
                    easing: 'easeOutBack'
                }, 600, () => {
                    this.isAnimating = false;
                });
            } else {
                // Fallback to direct anime.js
                anime({
                    targets: this.animState,
                    scale: [0, 1.1, 1],
                    opacity: [0, 1],
                    duration: 600,
                    easing: 'easeOutBack',
                    complete: () => {
                        this.isAnimating = false;
                    }
                });
            }
        }, delay);
    }
    
    // Animate button hover (uses animation manager)
    animateHover(isHovering) {
        if (this.isHovering === isHovering) return;
        this.isHovering = isHovering;
        
        if (typeof animManager !== 'undefined' && animManager.animateButtonHover) {
            animManager.animateButtonHover(this.animState, isHovering);
        }
    }
    
    // Animate button click
    animateClick(callback) {
        if (typeof animManager !== 'undefined' && animManager.animateUI) {
            const originalScale = this.animState.scale;
            animManager.animateUI(this.animState, {
                scale: [originalScale, originalScale * 0.95, originalScale]
            }, 150, callback);
        } else {
            anime({
                targets: this.animState,
                scale: [1, 0.95, 1],
                duration: 150,
                easing: 'easeInOutQuad',
                complete: () => {
                    if (callback) callback();
                }
            });
        }
    }
    
    // Check if point is inside button
    contains(x, y) {
        return x >= this.animState.x - this.width / 2 && 
               x <= this.animState.x + this.width / 2 &&
               y >= this.animState.y - this.height / 2 && 
               y <= this.animState.y + this.height / 2;
    }
    
    // Draw button
    draw() {
        ctx.save();
        
        // Apply transformations
        ctx.translate(this.animState.x, this.animState.y);
        ctx.scale(this.animState.scale, this.animState.scale);
        ctx.rotate(this.animState.rotation * Math.PI / 180);
        ctx.globalAlpha = this.animState.opacity;
        
        // Button background
        const btnX = -this.width / 2;
        const btnY = -this.height / 2;
        drawRoundedRect(btnX, btnY, this.width, this.height, 12);
        ctx.fillStyle = this.isHovering ? '#f0f0f0' : 'white';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Button text
        ctx.fillStyle = '#000';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, 0, 0);
        
        ctx.restore();
    }
}

class MainMenu {
    constructor() {
        this.buttons = [];
        this.titleAnimState = {
            x: 200,
            y: canvas.height / 2 - 150,
            opacity: 0,
            scale: 0
        };
        this.isVisible = false;
        this.initButtons();
    }
    
    initButtons() {
        const rightX = canvas.width - 200;
        const startY = canvas.height / 2.5;
        const spacing = 100;
        
        // Start button
        this.buttons.push(new MenuButton(
            'Start',
            rightX,
            startY,
            250,
            70,
            () => {
                if (typeof loadingScreen !== 'undefined') {
                    loadingScreen.show();
                    setTimeout(() => {
                        gameState = 'playing';
                        game.start();
                        setTimeout(() => {
                            loadingScreen.hide();
                        }, 400);
                    }, 300);
                } else {
                gameState = 'playing';
                game.start();
                }
            }
        ));
        
        // Credits button
        this.buttons.push(new MenuButton(
            'Credits',
            rightX,
            startY + spacing,
            250,
            70,
            () => {
                gameState = 'credits';
                if (typeof initCredits !== 'undefined') {
                    initCredits();
                }
                if (typeof playSound !== 'undefined') {
                    playSound('woah', { volume: 0.2 });
                }
            }
        ));
        
        // Settings button (COMMENTED OUT)
        // this.buttons.push(new MenuButton(
        //     'Settings',
        //     centerX,
        //     startY + spacing,
        //     250,
        //     70,
        //     () => {
        //         gameState = 'settings';
        //         if (typeof initSettingsMenu !== 'undefined') {
        //             initSettingsMenu();
        //         }
        //     }
        // ));
        
        // Quit button
        this.buttons.push(new MenuButton(
            'Quit',
            rightX,
            startY + spacing * 2,
            250,
            70,
            () => {
                window.close();
            }
        ));
    }
    
    // Show menu with animations
    show() {
        this.isVisible = true;
        
        // Animate title
        if (typeof animManager !== 'undefined' && animManager.animateUI) {
            this.titleAnimState.x = 200;
            this.titleAnimState.y = canvas.height / 2 - 150;
            this.titleAnimState.opacity = 0;
            this.titleAnimState.scale = 0;
            animManager.animateUI(this.titleAnimState, {
                x: 200,
                y: canvas.height / 2 - 150,
                opacity: 1,
                scale: [0, 1.1, 1]
            }, 800);
        } else {
            anime({
                targets: this.titleAnimState,
                x: 200,
                y: canvas.height / 2 - 150,
                opacity: [0, 1],
                scale: [0, 1.1, 1],
                duration: 800,
                easing: 'easeOutBack'
            });
        }
        
        // Animate buttons with stagger
        this.buttons.forEach((btn, index) => {
            btn.animateIn(index * 100);
        });
    }
    
    // Hide menu
    hide() {
        this.isVisible = false;
        if (typeof animManager !== 'undefined' && animManager.animateUI) {
            animManager.animateUI(this.titleAnimState, {
                opacity: 0,
                scale: 0
            }, 300);
            
            this.buttons.forEach((btn) => {
                animManager.animateUI(btn.animState, {
                    opacity: 0,
                    scale: 0
                }, 300);
            });
        } else {
            anime({
                targets: this.titleAnimState,
                opacity: 0,
                scale: 0,
                duration: 300,
                easing: 'easeInBack'
            });
            
            this.buttons.forEach((btn) => {
                anime({
                    targets: btn.animState,
                    opacity: 0,
                    scale: 0,
                    duration: 300,
                    easing: 'easeInBack'
                });
            });
        }
    }
    
    // Update hover states
    updateHover(mouseX, mouseY) {
        this.buttons.forEach(btn => {
            const isHovering = btn.contains(mouseX, mouseY);
            btn.animateHover(isHovering);
        });
    }
    
    // Handle click
    handleClick(x, y) {
        for (let btn of this.buttons) {
            if (btn.contains(x, y)) {
                btn.animateClick(() => {
                    btn.action();
                });
                return true;
            }
        }
        return false;
    }
    
    // Draw menu
    draw() {
        if (!this.isVisible) return;
        
        // Draw title (left side)
        ctx.save();
        ctx.globalAlpha = this.titleAnimState.opacity;
        ctx.translate(this.titleAnimState.x, this.titleAnimState.y);
        ctx.scale(this.titleAnimState.scale, this.titleAnimState.scale);
        ctx.fillStyle = 'black';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('Quick Paws BETA', 0, 0);
        ctx.restore();
        
        // Draw buttons
        this.buttons.forEach(btn => {
            btn.draw();
        });
    }
}

// Create menu instance
const mainMenu = new MainMenu();

