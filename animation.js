// ============================================================
// ANIMATION SYSTEM (Anime.js)
// ============================================================

class AnimationManager {
    constructor() {
        this.activeAnimations = new Map();
        this.animationId = 0;
    }
    
    // ANIMATION: Card flies to center pile with pop effect
    // Used when: Cards are placed on center piles from hands
    // Effect: Smooth movement + scale pop (1 → 1.25 → 1.05 → 1)
    animateCardToPile(card, fromX, fromY, toX, toY, pileNum, callback) {
        const id = this.animationId++;
        const animState = {
            card: card,
            x: fromX,
            y: fromY,
            rotation: 0,
            scale: 1,
            pileNum: pileNum,
            isActive: true
        };
        
        this.activeAnimations.set(id, animState);
        
        // [DEVTOOLS] Trace animation
        if (typeof traceAnimation !== 'undefined') {
            traceAnimation('TO_PILE', card, fromX, fromY, toX, toY);
        }
        
        anime({
            targets: animState,
            x: toX,
            y: toY,
            scale: [1, 1.25, 1.05, 1], // Pop effect
            duration: 450,
            easing: 'easeOutCubic',
            complete: () => {
                this.activeAnimations.delete(id);
                if (callback) callback();
            }
        });
    }
    
    // ANIMATION: New card draws from deck with 360° spin
    // Used when: Drawing new cards from deck pile
    // Effect: Starts small (0.8 scale), spins full rotation, grows to full size
    animateCardDraw(card, fromX, fromY, toX, toY, callback) {
        const id = this.animationId++;
        const animState = {
            card: card,
            x: fromX,
            y: fromY,
            rotation: 0,
            scale: 0.8,
            isActive: true,
            isDraw: true
        };
        
        this.activeAnimations.set(id, animState);
        
        // [DEVTOOLS] Trace animation
        if (typeof traceAnimation !== 'undefined') {
            traceAnimation('DRAW', card, fromX, fromY, toX, toY);
        }
        
        anime({
            targets: animState,
            x: toX,
            y: toY,
            scale: 1,
            rotation: [0, 360], // Full spin
            duration: 500,
            easing: 'easeOutBack',
            complete: () => {
                this.activeAnimations.delete(id);
                if (callback) callback();
            }
        });
    }
    
    // ANIMATION: CPU plays card - faster and more dramatic than player
    // Used when: CPU plays a card to center pile
    // Effect: Fast movement (380ms), bigger rotation (±25°), scale pop
    animateCPUCardPlay(card, fromX, fromY, toX, toY, callback) {
        const id = this.animationId++;
        const animState = {
            card: card,
            x: fromX,
            y: fromY,
            rotation: 0,
            scale: 1,
            isActive: true,
            isCPU: true
        };
        
        this.activeAnimations.set(id, animState);
        
        // [DEVTOOLS] Trace animation
        if (typeof traceAnimation !== 'undefined') {
            traceAnimation('CPU', card, fromX, fromY, toX, toY);
        }
        
        anime({
            targets: animState,
            x: toX,
            y: toY,
            rotation: [(Math.random() - 0.5) * 25, 0],
            scale: [1, 1.2, 1.05, 1],
            duration: 380,
            easing: 'easeOutCubic',
            complete: () => {
                this.activeAnimations.delete(id);
                if (callback) callback();
            }
        });
        
        return id; // Return animation ID for tracking/cancellation
    }
    
    // ANIMATION: New card appears in player/CPU hand after drawing
    // Used when: Refilling hand from draw pile after playing a card
    // Effect: Starts tilted (-10°) and small (0.7), bounces into position with easeOutBack
    animateNewHandCard(card, fromX, fromY, toX, toY, delay = 0, callback) {
        const id = this.animationId++;
        const animState = {
            card: card,
            x: fromX,
            y: fromY,
            // remove rotation but you never know.
            // rotation: -10,
            scale: 0.7,
            isActive: true,
            isNewCard: true
        };
        
        this.activeAnimations.set(id, animState);
        
        // [DEVTOOLS] Trace animation
        if (typeof traceAnimation !== 'undefined') {
            traceAnimation('NEW_HAND', card, fromX, fromY, toX, toY);
        }
        
        anime({
            targets: animState,
            x: toX,
            y: toY,
            rotation: 0,
            scale: 1,
            duration: 450,
            delay: delay,
            easing: 'easeOutBack',
            complete: () => {
                this.activeAnimations.delete(id);
                if (callback) callback();
            }
        });
    }
    
    // ANIMATION: Card returns to original position after invalid drop
    // Used when: Player releases card without hovering over a valid pile
    // Effect: Smooth slide back with easeOutCubic for natural feel
    animateCardReturn(card, fromX, fromY, toX, toY, cardIndex, callback) {
        const id = this.animationId++;
        const animState = {
            card: card,
            cardIndex: cardIndex,
            x: fromX,
            y: fromY,
            rotation: 0,
            scale: 1,
            isActive: true,
            isReturn: true
        };
        
        this.activeAnimations.set(id, animState);
        
        // [DEVTOOLS] Trace animation
        if (typeof traceAnimation !== 'undefined') {
            traceAnimation('RETURN', card, fromX, fromY, toX, toY);
        }
        
        anime({
            targets: animState,
            x: toX,
            y: toY,
            duration: 300,
            easing: 'easeOutCubic',
            complete: () => {
                this.activeAnimations.delete(id);
                if (callback) callback();
            }
        });
        
        return id; // Return animation ID for tracking
    }
    
    // ANIMATION: Simple plop down when placing card on pile
    // Used when: Player successfully places card on center pile
    // Effect: Quick movement + subtle scale pop for satisfaction
    animateCardPlop(card, fromX, fromY, toX, toY, pileNum, callback) {
        const id = this.animationId++;
        const animState = {
            card: card,
            x: fromX,
            y: fromY,
            rotation: 0,
            scale: 1,
            isActive: true,
            isPlop: true,
            pileNum: pileNum
        };
        
        this.activeAnimations.set(id, animState);
        
        // [DEVTOOLS] Trace animation
        if (typeof traceAnimation !== 'undefined') {
            traceAnimation('PLOP', card, fromX, fromY, toX, toY);
        }
        
        anime({
            targets: animState,
            x: toX,
            y: toY,
            scale: [1, 1.15, 1],
            duration: 250,
            easing: 'easeOutQuad',
            complete: () => {
                this.activeAnimations.delete(id);
                if (callback) callback();
            }
        });
        
        return id;
    }
    
    // ANIMATION: Card shifts position in hand (smooth repositioning)
    // Used when: A card is removed from hand and remaining cards need to shift
    // Effect: Smooth slide to new position with easeOutCubic
    animateCardShift(card, fromX, fromY, toX, toY, cardIndex, callback) {
        const id = this.animationId++;
        const animState = {
            card: card,
            cardIndex: cardIndex,
            x: fromX,
            y: fromY,
            rotation: 0,
            scale: 1,
            isActive: true,
            isShift: true
        };
        
        this.activeAnimations.set(id, animState);
        
        // [DEVTOOLS] Trace animation
        if (typeof traceAnimation !== 'undefined') {
            traceAnimation('SHIFT', card, fromX, fromY, toX, toY);
        }
        
        anime({
            targets: animState,
            x: toX,
            y: toY,
            duration: 300,
            easing: 'easeOutCubic',
            complete: () => {
                this.activeAnimations.delete(id);
                if (callback) callback();
            }
        });
        
        return id;
    }
    
    // Get all currently active animations for rendering
    getActiveAnimations() {
        return Array.from(this.activeAnimations.values());
    }
    
    // Clear all active animations (used when starting new game)
    clear() {
        this.activeAnimations.clear();
    }
    
    // Generic UI animation helper (for menus, credits, etc.)
    // All anime.js animations should go through this or other AnimationManager methods
    animateUI(target, properties, duration = 400, callback) {
        const animConfig = {
            targets: target,
            duration: duration,
            easing: 'easeOutQuad',
            complete: () => {
                if (callback) callback();
            }
        };
        
        // Copy properties into config
        Object.assign(animConfig, properties);
        
        anime(animConfig);
    }
    
    // ANIMATION: Button hover effect
    // Used when: Menu buttons are hovered
    // Effect: Scale pop in/out
    animateButtonHover(buttonState, isHovering) {
        anime({
            targets: buttonState,
            scale: isHovering ? 1.05 : 1,
            duration: 200,
            easing: 'easeOutQuad'
        });
    }
    
    // ANIMATION: Keyboard cursor slides between cards
    // Used when: Player navigates with arrow keys
    // Effect: Smooth slide with slight overshoot (easeOutBack)
    animateCursorSlide(cursorState, toX, toY, callback) {
        anime.remove(cursorState); // Cancel any existing animation
        
        anime({
            targets: cursorState,
            x: toX,
            y: toY,
            duration: 150,
            easing: 'easeOutCubic',
            complete: () => {
                if (callback) callback();
            }
        });
    }
    
    // ANIMATION: Shake effect for invalid placement
    // Used when: Player tries to place card on invalid pile
    // Effect: Quick horizontal shake
    animateShake(state, callback) {
        const originalX = state.x;
        
        anime({
            targets: state,
            x: [
                { value: originalX - 10, duration: 50 },
                { value: originalX + 10, duration: 50 },
                { value: originalX - 8, duration: 50 },
                { value: originalX + 8, duration: 50 },
                { value: originalX - 5, duration: 50 },
                { value: originalX + 5, duration: 50 },
                { value: originalX, duration: 50 }
            ],
            easing: 'easeInOutQuad',
            complete: () => {
                state.x = originalX;
                if (callback) callback();
            }
        });
    }
}

const animManager = new AnimationManager();

