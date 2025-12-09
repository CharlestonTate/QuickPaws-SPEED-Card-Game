// ============================================================
// GAME CLASSES (Deck & SpeedGame)
// ============================================================

// --- Deck Class ---
class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }
    
    reset() {
        this.cards = [];
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        for (let suit of suits) {
            for (let value of values) {
                this.cards.push({ value, suit, numValue: this.getNumValue(value) });
            }
        }
    }
    
    getNumValue(value) {
        if (value === 'A') return 1;
        if (value === 'J') return 11;
        if (value === 'Q') return 12;
        if (value === 'K') return 13;
        return parseInt(value);
    }
    
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    
    draw() {
        return this.cards.pop();
    }
}

// --- Speed Game Class ---
class SpeedGame {
    constructor() {
        this.deck = new Deck();
        this.playerHand = [];
        this.cpuHand = [];
        this.pile1 = null;
        this.pile2 = null;
        this.playerDrawPile = [];
        this.cpuDrawPile = [];
        this.centerDraw1 = [];
        this.centerDraw2 = [];
        this.pile1Stack = []; // Stack of played cards on pile 1
        this.pile2Stack = []; // Stack of played cards on pile 2
        this.gameActive = false;
        this.cpuCardIndex = 0;
        this.cpuInterval = null;
        this.cpuStartTimeout = null; // Track the setTimeout for starting CPU
        this.flipTimeout = null; // Track the setTimeout for flipping piles
        this.flipCheckCount = 0; // Track how many times we've checked for deadlock
        this.pendingCPUPlays = new Map(); // Track CPU card plays in progress: pileNum -> {card, animationId, targetPile}
        this.winMessage = '';
        this.introTimeouts = []; // Track intro animation timeouts for cleanup
        this.handsRevealed = false; // Hide hands until intro deals them
        this.waitingForFlipClick = false; // Waiting for user to click flip pile to start countdown
    }
    
    // Initialize new game
    start() {
        // Clear any pending intro timeouts and countdown
        this.clearIntroTimeouts();
        if (typeof window.introCountdown !== 'undefined') {
            window.introCountdown.text = '';
            window.introCountdown.opacity = 0;
            window.introCountdown.scale = 1;
        }

        // Stop any existing CPU interval
        if (this.cpuInterval) {
            clearInterval(this.cpuInterval);
            this.cpuInterval = null;
        }
        
        // Clear any pending CPU start timeout
        if (this.cpuStartTimeout) {
            clearTimeout(this.cpuStartTimeout);
            this.cpuStartTimeout = null;
        }
        
        // Clear any pending flip timeout
        if (this.flipTimeout) {
            clearTimeout(this.flipTimeout);
            this.flipTimeout = null;
        }
        this.flipCheckCount = 0;
        
        // Clear all active animations
        animManager.clear();
        
        // Reset deck and shuffle
        this.deck.reset();
        this.deck.shuffle();
        
        // Clear all hands and piles
        this.playerHand = [];
        this.cpuHand = [];
        this.playerDrawPile = [];
        this.cpuDrawPile = [];
        this.centerDraw1 = [];
        this.centerDraw2 = [];
        this.pile1Stack = [];
        this.pile2Stack = [];
        this.pile1 = null;
        this.pile2 = null;
        this.pendingCPUPlays.clear();
        this.winMessage = '';
        this.handsRevealed = false;
        this.waitingForFlipClick = false;
        
        // Deal cards to arrays (no animation yet)
        for (let i = 0; i < 5; i++) {
            this.playerHand.push(this.deck.draw());
            this.cpuHand.push(this.deck.draw());
        }
        
        for (let i = 0; i < 15; i++) {
            this.playerDrawPile.push(this.deck.draw());
            this.cpuDrawPile.push(this.deck.draw());
        }
        
        for (let i = 0; i < 6; i++) {
            this.centerDraw1.push(this.deck.draw());
            this.centerDraw2.push(this.deck.draw());
        }
        
        this.gameActive = false; // Will be set to true after intro animation
        this.cpuCardIndex = 0;
        
        // Reset combo system
        if (typeof comboSystem !== 'undefined') {
            comboSystem.reset();
        }
        
        // Start the cinematic intro animation
        this.playIntroAnimation();
    }
    
    // Clear all intro-related timeouts
    clearIntroTimeouts() {
        for (const id of this.introTimeouts) {
            clearTimeout(id);
        }
        this.introTimeouts = [];
    }

    // Cinematic intro animation sequence
    playIntroAnimation() {
        // Helper to schedule and track timeouts so they can be cleared
        const schedule = (fn, delay) => {
            const id = setTimeout(fn, delay);
            this.introTimeouts.push(id);
        };

        // Create a timeline for the intro
        let currentDelay = 0;
        const dealSpeed = 50; // Faster dealing speed
        
        // Center of screen for dealing start point
        const centerX = canvas.width / 2 - CENTER_CARD_WIDTH / 2;
        const centerY = canvas.height / 2 - CENTER_CARD_HEIGHT / 2;
        
        // Step 1: Deal 6 cards to each center draw pile
        const deck1Pos = getDeckPosition(1);
        const deck2Pos = getDeckPosition(2);
        
        for (let i = 0; i < 6; i++) {
            schedule(() => {
                if (gameState !== 'playing') return;
                animManager.animateCardToPile(
                    { value: 'back', suit: '', numValue: 0 }, // Use back placeholder
                    centerX,
                    centerY,
                    deck1Pos.x,
                    deck1Pos.y,
                    1,
                    () => {
                        if (typeof playSound !== 'undefined') {
                            playSound('shoosh', { volume: 0.4 });
                        }
                    }
                );
            }, currentDelay);
            currentDelay += dealSpeed;
            
            schedule(() => {
                if (gameState !== 'playing') return;
                animManager.animateCardToPile(
                    { value: 'back', suit: '', numValue: 0 },
                    centerX,
                    centerY,
                    deck2Pos.x,
                    deck2Pos.y,
                    2,
                    () => {
                        if (typeof playSound !== 'undefined') {
                            playSound('shoosh', { volume: 0.4 });
                        }
                    }
                );
            }, currentDelay);
            currentDelay += dealSpeed;
        }
        
        // Step 2: Deal 15 cards to each player's draw pile (in center first)
        currentDelay += 120; // Shorter pause before next sequence
        const playerDrawPos = getPlayerDrawPilePosition();
        const cpuDrawPos = getCPUDrawPilePosition();

        // Play long sort/deal sound once when starting draw pile distribution
        let sortLongAudio = null;
        const totalDrawDeals = 15 * 2; // CPU + player
        const drawStageDuration = totalDrawDeals * dealSpeed;
        schedule(() => {
            if (typeof playSound !== 'undefined') {
                sortLongAudio = playSound('sortLong', { volume: 0.7 });
            }
        }, currentDelay);
        
        for (let i = 0; i < 15; i++) {
            // CPU cards
            schedule(() => {
                if (gameState !== 'playing') return;
                animManager.animateCardToPile(
                    { value: 'back', suit: '', numValue: 0 },
                    centerX,
                    centerY,
                    cpuDrawPos.x,
                    cpuDrawPos.y,
                    null,
                    () => {
                        if (typeof playSound !== 'undefined') {
                            playSound('shoosh', { volume: 0.3 });
                        }
                    }
                );
            }, currentDelay);
            currentDelay += dealSpeed;
            
            // Player cards
            schedule(() => {
                if (gameState !== 'playing') return;
                animManager.animateCardToPile(
                    { value: 'back', suit: '', numValue: 0 },
                    centerX,
                    centerY,
                    playerDrawPos.x,
                    playerDrawPos.y,
                    null,
                    () => {
                        if (typeof playSound !== 'undefined') {
                            playSound('shoosh', { volume: 0.3 });
                        }
                    }
                );
            }, currentDelay);
            currentDelay += dealSpeed;
        }
        
        // Fade out/stop the long sort sound when draw piles finished
        schedule(() => {
            if (sortLongAudio && typeof fadeOutAudio !== 'undefined') {
                fadeOutAudio(sortLongAudio, 300);
            } else if (sortLongAudio) {
                sortLongAudio.pause();
                sortLongAudio.currentTime = 0;
            }
        }, currentDelay + 50);

        // Step 3: Deal 5 cards to each player's hand
        currentDelay += 180;
        
        for (let i = 0; i < 5; i++) {
            // CPU hand
            schedule(() => {
                if (gameState !== 'playing') return;
                const cpuPos = getCardPosition(i, 5, true);
                animManager.animateCardDraw(
                    { value: 'back', suit: '', numValue: 0 },
                    cpuDrawPos.x,
                    cpuDrawPos.y,
                    cpuPos.x,
                    cpuPos.y,
                    () => {
                        if (typeof playSound !== 'undefined') {
                            playSound('shoosh', { volume: 0.5 });
                        }
                    }
                );
            }, currentDelay);
            currentDelay += dealSpeed;
            
            // Player hand
            schedule(() => {
                if (gameState !== 'playing') return;
                const playerPos = getCardPosition(i, 5, false);
                animManager.animateCardDraw(
                    this.playerHand[i],
                    playerDrawPos.x,
                    playerDrawPos.y,
                    playerPos.x,
                    playerPos.y,
                    () => {
                        if (typeof playSound !== 'undefined') {
                            playSound('shoosh', { volume: 0.5 });
                        }
                    }
                );
            }, currentDelay);
            currentDelay += dealSpeed;
        }

        // Reveal hands after dealing finishes and wait for user to click flip pile
        schedule(() => {
            this.handsRevealed = true;
            this.waitingForFlipClick = true; // Enable click detection for flip pile
        }, currentDelay + 50);
    }
    
    // Continue intro animation after user clicks flip pile (countdown and flip)
    continueIntroCountdown() {
        if (!this.waitingForFlipClick || gameState !== 'playing') return;
        
        this.waitingForFlipClick = false;
        
        // Helper to schedule and track timeouts so they can be cleared
        const schedule = (fn, delay) => {
            const id = setTimeout(fn, delay);
            this.introTimeouts.push(id);
        };
        
        let currentDelay = 0;
        
        // Get deck positions for later use
        const deck1Pos = getDeckPosition(1);
        const deck2Pos = getDeckPosition(2);
        
        // Step 4: Show countdown (3, 2, 1, FLIP!)
        currentDelay += 200;
        
        // Create countdown state
        if (typeof window.introCountdown === 'undefined') {
            window.introCountdown = { text: '', opacity: 0, scale: 1 };
        }
        
        // 3
        schedule(() => {
            if (gameState !== 'playing') return;
            window.introCountdown.text = '3';
            window.introCountdown.opacity = 0;
            anime({
                targets: window.introCountdown,
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 1],
                duration: 800,
                easing: 'easeOutCubic'
            });
            if (typeof playSound !== 'undefined') {
                playSound('bump', { volume: 0.6 });
            }
        }, currentDelay);
        currentDelay += 900;
        
        // 2
        schedule(() => {
            if (gameState !== 'playing') return;
            window.introCountdown.text = '2';
            window.introCountdown.opacity = 0;
            anime({
                targets: window.introCountdown,
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 1],
                duration: 800,
                easing: 'easeOutCubic'
            });
            if (typeof playSound !== 'undefined') {
                playSound('bump', { volume: 0.7 });
            }
        }, currentDelay);
        currentDelay += 900;
        
        // 1
        schedule(() => {
            if (gameState !== 'playing') return;
            window.introCountdown.text = '1';
            window.introCountdown.opacity = 0;
            anime({
                targets: window.introCountdown,
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 1],
                duration: 800,
                easing: 'easeOutCubic'
            });
            if (typeof playSound !== 'undefined') {
                playSound('bump', { volume: 0.8 });
            }
        }, currentDelay);
        currentDelay += 900;
        
        // FLIP!
        schedule(() => {
            if (gameState !== 'playing') return;
            window.introCountdown.text = 'FLIP!';
            window.introCountdown.opacity = 0;
            anime({
                targets: window.introCountdown,
                opacity: [0, 1, 0],
                scale: [0.8, 2, 1.5],
                duration: 1000,
                easing: 'easeOutCubic'
            });
            if (typeof playSound !== 'undefined') {
                playSound('bump', { volume: 1.0 });
            }
        }, currentDelay);
        currentDelay += 500;
        
        // Step 5: Flip two cards from center draw piles
        schedule(() => {
            if (gameState !== 'playing') return;
            
            const pile1Card = this.centerDraw1[this.centerDraw1.length - 1];
            const pile2Card = this.centerDraw2[this.centerDraw2.length - 1];
            const pile1Pos = getCenterPilePosition(1);
            const pile2Pos = getCenterPilePosition(2);
            
            // Flip pile 1
            animManager.animateCardToPile(
                pile1Card,
                deck1Pos.x,
                deck1Pos.y,
                pile1Pos.x,
                pile1Pos.y,
                1,
                () => { 
                    this.pile1 = this.centerDraw1.pop();
                    if (typeof playSound !== 'undefined') {
                        playSound('shoosh', { volume: 1.0 });
                    }
                }
            );
        }, currentDelay);
        
        currentDelay += 150;
        
        schedule(() => {
            if (gameState !== 'playing') return;
            
            const pile2Card = this.centerDraw2[this.centerDraw2.length - 1];
            const pile2Pos = getCenterPilePosition(2);
            
            // Flip pile 2
            animManager.animateCardToPile(
                pile2Card,
                deck2Pos.x,
                deck2Pos.y,
                pile2Pos.x,
                pile2Pos.y,
                2,
                () => { 
                    this.pile2 = this.centerDraw2.pop();
                    if (typeof playSound !== 'undefined') {
                        playSound('shoosh', { volume: 1.0 });
                    }
                    
                    // Clear countdown text
                    window.introCountdown.text = '';
                    window.introCountdown.opacity = 0;
                }
            );
        }, currentDelay);
        
        // Step 6: Start the game!
        currentDelay += 400;
        schedule(() => {
            if (gameState !== 'playing') return;
            this.gameActive = true;
            this.startCPU();
            // Clear remaining intro timeouts now that the game is live
            this.clearIntroTimeouts();
        }, currentDelay);
    }
    
    // Check if a card can be played on a pile (Speed rules: ±1 or wrap around)
    canPlay(card, pileCard) {
        const diff = Math.abs(card.numValue - pileCard.numValue);
        return diff === 1 || diff === 12; // Adjacent values or King-Ace wrap
    }
    
    // Cancel a pending CPU play and return card to CPU hand
    cancelCPUPlay(pileNum) {
        if (!this.pendingCPUPlays.has(pileNum)) {
            return false;
        }
        
        const pendingPlay = this.pendingCPUPlays.get(pileNum);
        const cpuCard = pendingPlay.card;
        const animId = pendingPlay.animationId;
        
        // Cancel the animation by removing it from active animations
        // Find the animation by ID
        for (let [id, anim] of animManager.activeAnimations.entries()) {
            if (id === animId && anim.isCPU && anim.card === cpuCard) {
                // Get current position of the animating card
                const currentX = anim.x;
                const currentY = anim.y;
                
                // Remove the animation
                animManager.activeAnimations.delete(id);
                
                // Return card to CPU hand
                this.cpuHand.push(cpuCard);
                
                // Animate card returning to CPU hand from its current position
                const handPos = getCardPosition(this.cpuHand.length - 1, this.cpuHand.length, true);
                animManager.animateCardReturn(cpuCard, currentX, currentY, handPos.x, handPos.y, this.cpuHand.length - 1);
                
                // Remove from pending plays
                this.pendingCPUPlays.delete(pileNum);
                
                // Play bump sound
                playSound('bump', { volume: 0.8 });
                
                return true;
            }
        }
        
        // If animation not found, still clean up
        this.pendingCPUPlays.delete(pileNum);
        this.cpuHand.push(cpuCard);
        playSound('bump', { volume: 0.8 });
        
        return true;
    }
    
    // Player plays a card to a pile
    playCard(card, pileNum, fromX, fromY) {
        const pileCard = pileNum === 1 ? this.pile1 : this.pile2;
        
        if (!this.canPlay(card, pileCard)) {
            return false;
        }
        
        // Check if CPU has a pending play on this pile - if so, cancel it (player wins the race)
        if (this.pendingCPUPlays.has(pileNum)) {
            this.cancelCPUPlay(pileNum);
        }
        
        // Remove card from player hand
        const idx = this.playerHand.indexOf(card);
        this.playerHand.splice(idx, 1);
        
        // Track combo (player played a card)
        if (typeof comboSystem !== 'undefined') {
            comboSystem.onPlayerPlay();
        }
        
        // Animate remaining cards shifting to fill the gap
        for (let i = idx; i < this.playerHand.length; i++) {
            const oldPos = getCardPosition(i + 1, this.playerHand.length + 1); // Old position (before removal)
            const newPos = getCardPosition(i, this.playerHand.length); // New position (after removal)
            animManager.animateCardShift(this.playerHand[i], oldPos.x, oldPos.y, newPos.x, newPos.y, i);
        }
        
        // Animate card plopping onto pile
        const pilePos = getCenterPilePosition(pileNum);
        
        animManager.animateCardPlop(
            card,
            fromX,
            fromY,
            pilePos.x,
            pilePos.y,
            pileNum,
            () => {
                // After animation, place card on pile and add to stack
                // Only place if CPU hasn't already taken this spot
                if (!this.pendingCPUPlays.has(pileNum)) {
                    if (pileNum === 1) {
                        if (this.pile1) this.pile1Stack.push(this.pile1);
                        this.pile1 = card;
                    } else {
                        if (this.pile2) this.pile2Stack.push(this.pile2);
                        this.pile2 = card;
                    }
                    // Play shoosh sound when card is placed
                    if (typeof playSound !== 'undefined') {
                        playSound('shoosh', { volume: 1.0 });
                    }
                }
                isCardPlopping = false;
            }
        );
        
        // Cancel any pending flip since a card was just played
        if (this.flipTimeout) {
            clearTimeout(this.flipTimeout);
            this.flipTimeout = null;
        }
        this.flipCheckCount = 0;
        
        // Don't automatically draw - player must click the draw pile
        
        this.checkWin();
        return true;
    }
    
    // Player manually draws cards from their draw pile (draws all needed to reach 5)
    drawCard() {
        if (this.playerDrawPile.length === 0 || this.playerHand.length >= 5) {
            return false;
        }
        
        const drawPilePos = getPlayerDrawPilePosition();
        const cardsToDraw = Math.min(5 - this.playerHand.length, this.playerDrawPile.length);
        const newCards = [];
        
        // Pop all cards needed
        for (let i = 0; i < cardsToDraw; i++) {
            const newCard = this.playerDrawPile.pop();
            this.playerHand.push(newCard);
            newCards.push(newCard);
        }
        
        // Animate all new cards from draw pile to hand with staggered delays
        const maxDelay = (cardsToDraw - 1) * 100;
        newCards.forEach((card, index) => {
            const delay = index * 100; // Stagger each card by 100ms
            const newPos = getCardPosition(this.playerHand.length - cardsToDraw + index, this.playerHand.length);
            const isLastCard = index === cardsToDraw - 1;
            animManager.animateNewHandCard(card, drawPilePos.x, drawPilePos.y, newPos.x, newPos.y, delay, () => {
                // After last card animation completes, check for deadlock if player still can't play
                if (isLastCard) {
                    setTimeout(() => {
                        // Only check if still in playing state
                        if (gameState === 'playing' && this.gameActive) {
                            // Check if player still can't play after drawing new cards
                            if (!this.canPlayerPlay() && !this.canCPUPlay()) {
                                this.checkForDeadlock();
                            }
                        }
                    }, 100);
                }
            });
        });
        
        // Cancel any pending flip since new cards might create playable moves
        if (this.flipTimeout) {
            clearTimeout(this.flipTimeout);
            this.flipTimeout = null;
        }
        this.flipCheckCount = 0;
        
        return true;
    }
    
    // CPU attempts to play a card
    cpuPlay() {
        // Don't play if not in playing state or game is not active
        if (!this.gameActive || gameState !== 'playing' || this.cpuHand.length === 0) return;
        
        const card = this.cpuHand[this.cpuCardIndex];
        let played = false;
        let targetPile = null;
        
        // Check if card can be played on either pile
        if (this.canPlay(card, this.pile1)) {
            targetPile = 1;
            played = true;
        } else if (this.canPlay(card, this.pile2)) {
            targetPile = 2;
            played = true;
        }
        
        if (played) {
            const fromPos = getCardPosition(this.cpuCardIndex, this.cpuHand.length, true);
            const toPos = getCenterPilePosition(targetPile);
            
            // Remove card from CPU hand
            this.cpuHand.splice(this.cpuCardIndex, 1);
            
            // Track combo (CPU played a card, breaks player combo)
            if (typeof comboSystem !== 'undefined') {
                comboSystem.onCPUPlay();
            }
            
            // Animate remaining CPU cards shifting to fill the gap
            for (let i = this.cpuCardIndex; i < this.cpuHand.length; i++) {
                const oldPos = getCardPosition(i + 1, this.cpuHand.length + 1, true); // Old position (before removal)
                const newPos = getCardPosition(i, this.cpuHand.length, true); // New position (after removal)
                animManager.animateCardShift(this.cpuHand[i], oldPos.x, oldPos.y, newPos.x, newPos.y, i);
            }
            
            // Track this as a pending CPU play (card not actually placed until animation completes)
            const animId = animManager.animateCPUCardPlay(
                card,
                fromPos.x,
                fromPos.y,
                toPos.x,
                toPos.y,
                () => {
                    // Only place card if this play is still valid (not blocked)
                    if (this.pendingCPUPlays.has(targetPile)) {
                        const pendingPlay = this.pendingCPUPlays.get(targetPile);
                        if (pendingPlay.animationId === animId) {
                            // This play completed successfully - now draw a new card
                            if (targetPile === 1) {
                                if (this.pile1) this.pile1Stack.push(this.pile1);
                                this.pile1 = card;
                            } else {
                                if (this.pile2) this.pile2Stack.push(this.pile2);
                                this.pile2 = card;
                            }
                            // Play shoosh sound when CPU card is placed
                            if (typeof playSound !== 'undefined') {
                                playSound('shoosh', { volume: 1.0 });
                            }
                            
                            // Draw new card for CPU only after successful play
                            if (this.cpuDrawPile.length > 0) {
                                const newCard = this.cpuDrawPile.pop();
                                
                                // Calculate positions before adding to hand
                                const deckPos = { x: canvas.width / 2 - CARD_WIDTH / 2, y: 20 };
                                const tempHandLength = this.cpuHand.length;
                                this.cpuHand.push(newCard);
                                const newPos = getCardPosition(tempHandLength, this.cpuHand.length, true);
                                
                                // Start animation immediately (no delay) to prevent glitching
                                animManager.animateNewHandCard(newCard, deckPos.x, deckPos.y, newPos.x, newPos.y, 0);
                                
                                // Cancel any pending flip since new cards might create playable moves
                                if (this.flipTimeout) {
                                    clearTimeout(this.flipTimeout);
                                    this.flipTimeout = null;
                                }
                                this.flipCheckCount = 0;
                            }
                        }
                        // Remove from pending plays
                        this.pendingCPUPlays.delete(targetPile);
                    }
                }
            );
            
            // Store pending play info
            this.pendingCPUPlays.set(targetPile, {
                card: card,
                animationId: animId,
                targetPile: targetPile
            });
            
            this.cpuCardIndex = (this.cpuCardIndex + 1) % this.cpuHand.length;
            
            // Cancel any pending flip since a card was just played
            if (this.flipTimeout) {
                clearTimeout(this.flipTimeout);
                this.flipTimeout = null;
            }
            this.flipCheckCount = 0;
            
            this.checkWin();
        } else {
            this.cpuCardIndex = (this.cpuCardIndex + 1) % this.cpuHand.length;
            
            // If CPU can't play and has cycled through all cards, check for deadlock
            // This means CPU has tried all cards and none can be played
            if (this.cpuCardIndex === 0) {
                // Start deadlock check - check if both players are stuck
                // Use a small delay to ensure game state is stable
                setTimeout(() => {
                    // Only check for deadlock if still in playing state
                    if (gameState === 'playing' && this.gameActive) {
                    this.checkForDeadlock();
                    }
                }, 300);
            }
        }
    }
    
    // Flip new cards from center decks when no moves available
    flipDrawPiles() {
        // Reset flip check state
        this.flipCheckCount = 0;
        if (this.flipTimeout) {
            clearTimeout(this.flipTimeout);
            this.flipTimeout = null;
        }
        
        // If center draws are empty, recycle the played cards from the piles
        if (this.centerDraw1.length === 0 && this.centerDraw2.length === 0) {
            // Check if we have cards to recycle
            if (this.pile1Stack.length > 0 || this.pile2Stack.length > 0) {
                // Move pile stacks to center draws (keeping current top cards)
                this.centerDraw1 = [...this.pile1Stack];
                this.centerDraw2 = [...this.pile2Stack];
                
                // Clear the stacks
                this.pile1Stack = [];
                this.pile2Stack = [];
                
                // Shuffle the recycled cards for variety
                this.shuffleArray(this.centerDraw1);
                this.shuffleArray(this.centerDraw2);
            } else {
                // No cards left to recycle - this shouldn't happen in normal play
                // but if it does, the game will end via checkWin
                return;
            }
        }
        
        if (this.centerDraw1.length > 0 && this.centerDraw2.length > 0) {
            const newPile1 = this.centerDraw1.pop();
            const newPile2 = this.centerDraw2.pop();
            
            const deck1Pos = getDeckPosition(1);
            const deck2Pos = getDeckPosition(2);
            const pile1Pos = getCenterPilePosition(1);
            const pile2Pos = getCenterPilePosition(2);
            
            // Animate first pile card flip
            animManager.animateCardToPile(
                newPile1,
                deck1Pos.x,
                deck1Pos.y,
                pile1Pos.x,
                pile1Pos.y,
                1,
                () => { 
                    if (this.pile1) this.pile1Stack.push(this.pile1);
                    this.pile1 = newPile1;
                    if (typeof playSound !== 'undefined') {
                        playSound('shoosh', { volume: 1.0 });
                    }
                }
            );
            
            // Animate second pile card flip
            setTimeout(() => {
                // Only animate if still in playing state
                if (gameState !== 'playing' || !this.gameActive) return;
                
                animManager.animateCardToPile(
                    newPile2,
                    deck2Pos.x,
                    deck2Pos.y,
                    pile2Pos.x,
                    pile2Pos.y,
                    2,
                    () => { 
                        if (this.pile2) this.pile2Stack.push(this.pile2);
                        this.pile2 = newPile2;
                        if (typeof playSound !== 'undefined') {
                            playSound('shoosh', { volume: 1.0 });
                        }
                    }
                );
            }, 100);
            
            this.cpuCardIndex = 0;
        }
    }
    
    // Helper method to shuffle an array
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    // Check if player has any valid moves
    canPlayerPlay() {
        for (let card of this.playerHand) {
            if (this.canPlay(card, this.pile1) || this.canPlay(card, this.pile2)) {
                return true;
            }
        }
        return false;
    }
    
    // Check if CPU has any valid moves
    canCPUPlay() {
        for (let card of this.cpuHand) {
            if (this.canPlay(card, this.pile1) || this.canPlay(card, this.pile2)) {
                return true;
            }
        }
        return false;
    }
    
    // Check for deadlock and schedule flip if both players are stuck
    checkForDeadlock() {
        // Check immediately if both players can't play
        const playerCanPlay = this.canPlayerPlay();
        const cpuCanPlay = this.canCPUPlay();
        
        // If either can play, no deadlock - cancel any pending check and return
        if (playerCanPlay || cpuCanPlay) {
            if (this.flipTimeout !== null) {
                clearTimeout(this.flipTimeout);
                this.flipTimeout = null;
            }
            this.flipCheckCount = 0;
            return;
        }
        
        // Both players are stuck - if a check is already in progress, don't restart it
        if (this.flipTimeout !== null) {
            return;
        }
        
        // Start the 2 second wait, then verify multiple times
        this.flipCheckCount = 0;
        this.flipTimeout = setTimeout(() => {
            // Only perform check if still in playing state
            if (gameState === 'playing' && this.gameActive) {
            this.performDeadlockCheck();
            } else {
                this.flipTimeout = null;
                this.flipCheckCount = 0;
            }
        }, 2000); // Wait 2 seconds before first verification
    }
    
    // Perform deadlock check (runs multiple times to be sure)
    performDeadlockCheck() {
        // Don't check if we're not in playing state
        if (gameState !== 'playing' || !this.gameActive) {
            this.flipCheckCount = 0;
            this.flipTimeout = null;
            return;
        }
        
        // Check if both players truly can't play
        const playerCanPlay = this.canPlayerPlay();
        const cpuCanPlay = this.canCPUPlay();
        
        // If either can play, cancel the flip
        if (playerCanPlay || cpuCanPlay) {
            this.flipCheckCount = 0;
            this.flipTimeout = null;
            return;
        }
        
        // Increment check count
        this.flipCheckCount++;
        
        // Run 3 verification checks total, 500ms apart, to ensure deadlock is real
        if (this.flipCheckCount < 3) {
            this.flipTimeout = setTimeout(() => {
                // Only continue if still in playing state
                if (gameState === 'playing' && this.gameActive) {
                this.performDeadlockCheck();
                } else {
                    this.flipTimeout = null;
                    this.flipCheckCount = 0;
                }
            }, 500);
        } else {
            // All 3 checks passed - both players are stuck, flip the piles
            if (this.centerDraw1.length > 0 || this.centerDraw2.length > 0 || 
                this.pile1Stack.length > 0 || this.pile2Stack.length > 0) {
                this.flipDrawPiles();
            }
            this.flipCheckCount = 0;
            this.flipTimeout = null;
        }
    }
    
    // Start CPU AI loop
    startCPU() {
        // Don't start if game is not active or not in playing state
        if (!this.gameActive || gameState !== 'playing') {
            return;
        }
        
        // Get CPU speed based on current difficulty
        const cpuSpeed = typeof difficultyManager !== 'undefined' 
            ? difficultyManager.getCPUSpeed() 
            : 800; // Default to 800ms if difficulty manager not loaded
        
        this.cpuInterval = setInterval(() => {
            // Stop if game is no longer active or we're not in playing state
            if (!this.gameActive || gameState !== 'playing') {
                clearInterval(this.cpuInterval);
                this.cpuInterval = null;
                return;
            }
            this.cpuPlay();
        }, cpuSpeed);
    }
    
    // Check for win conditions
    checkWin() {
        if (this.playerHand.length === 0 && this.playerDrawPile.length === 0) {
            this.gameActive = false;
            if (this.cpuInterval) {
                clearInterval(this.cpuInterval);
                this.cpuInterval = null;
            }
            gameState = 'gameover';
            
            // Show game over screen (player wins)
            if (typeof gameOverScreen !== 'undefined') {
                gameOverScreen.show(true); // true = win
            }
        } else if (this.cpuHand.length === 0 && this.cpuDrawPile.length === 0) {
            this.gameActive = false;
            if (this.cpuInterval) {
                clearInterval(this.cpuInterval);
                this.cpuInterval = null;
            }
            gameState = 'gameover';
            
            // Show game over screen (player loses)
            if (typeof gameOverScreen !== 'undefined') {
                gameOverScreen.show(false); // false = lose
            }
        }
    }
    
    // Stop the game completely (used when returning to main menu)
    stop() {
        // Stop game logic
        this.gameActive = false;
        
        // Cancel any intro timeouts and countdown
        this.clearIntroTimeouts();
        if (typeof window.introCountdown !== 'undefined') {
            window.introCountdown.text = '';
            window.introCountdown.opacity = 0;
            window.introCountdown.scale = 1;
        }
        this.handsRevealed = false;
        this.waitingForFlipClick = false;
        
        // Hide game over screen if active
        if (typeof gameOverScreen !== 'undefined') {
            gameOverScreen.hide();
        }
        
        // Reset combo system
        if (typeof comboSystem !== 'undefined') {
            comboSystem.reset();
        }

        // Stop CPU interval
        if (this.cpuInterval) {
            clearInterval(this.cpuInterval);
            this.cpuInterval = null;
        }
        
        // Clear CPU start timeout
        if (this.cpuStartTimeout) {
            clearTimeout(this.cpuStartTimeout);
            this.cpuStartTimeout = null;
        }
        
        // Clear flip timeout
        if (this.flipTimeout) {
            clearTimeout(this.flipTimeout);
            this.flipTimeout = null;
        }
        this.flipCheckCount = 0;
        
        // Clear pending CPU plays
        this.pendingCPUPlays.clear();
        
        // Clear all active animations
        animManager.clear();
        
        // Clear center piles to prevent visual artifacts
        this.pile1 = null;
        this.pile2 = null;
        
        // Reset win message
        this.winMessage = '';
    }
}

const game = new SpeedGame();
window.game = game; // Make game accessible globally for devtools

// Devtools integration - pause/resume handlers
window.devtoolsPauseGame = function() {
    if (game.cpuInterval) {
        clearInterval(game.cpuInterval);
        game.cpuInterval = null;
    }
};

window.devtoolsResumeGame = function() {
    if (game.gameActive && !game.cpuInterval) {
        game.startCPU();
    }
};


