// ============================================================
// KEYBOARD CONTROLLER
// ============================================================

// Controller state
let keyboardMode = false;          // true when using keyboard, false when using mouse
let selectedCardIndex = 0;         // Currently selected card in hand (0-based)
let sortMode = false;              // true when X is held for sorting
let onDrawPile = false;            // true when cursor is on the draw pile

// Placement mode state
let placementMode = false;         // true when choosing which pile to place on
let placementPile = 1;             // Which pile is currently highlighted (1 or 2)
let placementCard = null;          // The card being placed
let placementCardIndex = -1;       // Original index of the card being placed

// Waiting period state (for starting game)
let onStartPile = false;           // true when cursor is on the flip pile to start game

// Animated cursor position (for smooth sliding)
const cursorState = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0
};

// Load cursor images
const cursorPointImg = new Image();
const cursorGrabImg = new Image();
cursorPointImg.src = 'cursor_point.png';
cursorGrabImg.src = 'cursor_grab.png';

// Switch to keyboard mode
function enableKeyboardMode() {
    if (!keyboardMode) {
        keyboardMode = true;
        // Hide the mouse cursor when using keyboard
        canvas.style.cursor = 'none';
        // Ensure selected index is valid
        if (game.playerHand.length > 0 && !onDrawPile && !placementMode) {
            selectedCardIndex = Math.min(selectedCardIndex, game.playerHand.length - 1);
            selectedCardIndex = Math.max(0, selectedCardIndex);
        }
        updateIndicatorPosition(true); // Instant position on first enable
    }
}

// Switch to mouse mode
function disableKeyboardMode() {
    keyboardMode = false;
    sortMode = false;
    onStartPile = false;
    // Show the mouse cursor again
    canvas.style.cursor = '';
    // Cancel placement mode if active
    if (placementMode) {
        cancelPlacement();
    }
}

// Get the target position for the cursor
function getTargetPosition() {
    if (onStartPile) {
        // Start pile position (right flip pile during waiting period)
        const deck2Pos = getDeckPosition(2);
        return {
            x: deck2Pos.x + CENTER_CARD_WIDTH / 2,
            y: deck2Pos.y + CENTER_CARD_HEIGHT - 8
        };
    } else if (placementMode) {
        // Cursor at bottom of the hovering card (to the side of the pile)
        const pilePos = getCenterPilePosition(placementPile);
        // Offset to the left for pile 1, right for pile 2
        const sideOffset = placementPile === 1 ? -CARD_WIDTH - 12 : CENTER_CARD_WIDTH + 12;
        const cardX = pilePos.x + sideOffset;
        const cardY = pilePos.y + (CENTER_CARD_HEIGHT - CARD_HEIGHT) / 2;
        return {
            x: cardX + CARD_WIDTH / 2,
            y: cardY + CARD_HEIGHT - 8
        };
    } else if (onDrawPile) {
        // Draw pile position - cursor at bottom edge of card
        const drawPilePos = getPlayerDrawPilePosition();
        return {
            x: drawPilePos.x + CARD_WIDTH / 2,
            y: drawPilePos.y + CARD_HEIGHT - 8
        };
    } else if (game.playerHand.length > 0) {
        // Card in hand position - cursor at bottom edge of card
        const pos = getCardPosition(selectedCardIndex, game.playerHand.length);
        return {
            x: pos.x + CARD_WIDTH / 2,
            y: pos.y + CARD_HEIGHT - 8
        };
    }
    return { x: canvas.width / 2, y: canvas.height - 50 };
}

// Update the visual indicator position based on selected card
function updateIndicatorPosition(instant = false) {
    if (!keyboardMode) return;
    
    const target = getTargetPosition();
    cursorState.targetX = target.x;
    cursorState.targetY = target.y;
    
    if (instant) {
        // Snap to position immediately
        cursorState.x = target.x;
        cursorState.y = target.y;
    } else {
        // Animate to position
        animManager.animateCursorSlide(cursorState, target.x, target.y);
    }
}

// Navigate to next card (right) - can cycle to draw pile
function selectNextCard() {
    if (placementMode) {
        // In placement mode, toggle between piles
        togglePlacementPile();
        return;
    }
    
    if (sortMode && !onDrawPile) {
        // In sort mode, move the card right
        moveSelectedCard(1);
        return;
    }
    
    if (onDrawPile) {
        // From draw pile, wrap to first card
        onDrawPile = false;
        selectedCardIndex = 0;
    } else if (game.playerHand.length > 0) {
        if (selectedCardIndex >= game.playerHand.length - 1) {
            // From last card, go to draw pile (if it has cards and hand not full)
            if (game.playerDrawPile.length > 0 && game.playerHand.length < 5) {
                onDrawPile = true;
            } else {
                // Wrap to first card
                selectedCardIndex = 0;
            }
        } else {
            selectedCardIndex++;
        }
    }
    
    updateIndicatorPosition();
}

// Navigate to previous card (left) - can cycle to draw pile
function selectPrevCard() {
    if (placementMode) {
        // In placement mode, toggle between piles
        togglePlacementPile();
        return;
    }
    
    if (sortMode && !onDrawPile) {
        // In sort mode, move the card left
        moveSelectedCard(-1);
        return;
    }
    
    if (onDrawPile) {
        // From draw pile, go to last card
        onDrawPile = false;
        if (game.playerHand.length > 0) {
            selectedCardIndex = game.playerHand.length - 1;
        }
    } else if (game.playerHand.length > 0) {
        if (selectedCardIndex <= 0) {
            // From first card, go to draw pile (if it has cards and hand not full)
            if (game.playerDrawPile.length > 0 && game.playerHand.length < 5) {
                onDrawPile = true;
            } else {
                // Wrap to last card
                selectedCardIndex = game.playerHand.length - 1;
            }
        } else {
            selectedCardIndex--;
        }
    }
    
    updateIndicatorPosition();
}

// Jump directly to draw pile
function jumpToDrawPile() {
    if (placementMode) {
        cancelPlacement();
    }
    if (game.playerDrawPile.length > 0 && game.playerHand.length < 5) {
        onDrawPile = true;
        updateIndicatorPosition();
    }
}

// Move selected card in hand (for sorting)
function moveSelectedCard(direction) {
    if (game.playerHand.length < 2 || onDrawPile || placementMode) return;
    
    const oldIndex = selectedCardIndex;
    const newIndex = oldIndex + direction;
    
    // Bounds check
    if (newIndex < 0 || newIndex >= game.playerHand.length) return;
    
    // Get the two cards that will swap
    const movingCard = game.playerHand[oldIndex];
    const swappingCard = game.playerHand[newIndex];
    
    // Get positions BEFORE the swap (same hand length, same positions)
    const movingCardOldPos = getCardPosition(oldIndex, game.playerHand.length);
    const swappingCardOldPos = getCardPosition(newIndex, game.playerHand.length);
    
    // Swap the cards in the array (simple swap, not splice)
    game.playerHand[oldIndex] = swappingCard;
    game.playerHand[newIndex] = movingCard;
    
    // Positions AFTER swap are the same grid positions (cards just trade places)
    const movingCardNewPos = getCardPosition(newIndex, game.playerHand.length);
    const swappingCardNewPos = getCardPosition(oldIndex, game.playerHand.length);
    
    // Animate the moving card (the one being dragged)
    animManager.animateCardShift(movingCard, movingCardOldPos.x, movingCardOldPos.y, movingCardNewPos.x, movingCardNewPos.y, newIndex);
    
    // Animate the swapping card (the one being displaced)
    animManager.animateCardShift(swappingCard, swappingCardOldPos.x, swappingCardOldPos.y, swappingCardNewPos.x, swappingCardNewPos.y, oldIndex);
    
    // Update selected index to follow the card
    selectedCardIndex = newIndex;
    updateIndicatorPosition();
    
    // Play a sound
    if (typeof playSound !== 'undefined') {
        playSound('bump', { volume: 0.3 });
    }
}

// Toggle between pile 1 and pile 2 during placement mode
function togglePlacementPile() {
    if (!placementMode) return;
    
    // Always allow toggling between piles visually
    placementPile = placementPile === 1 ? 2 : 1;
    updateIndicatorPosition();
}

// Enter placement mode - always let player choose/confirm the pile
function initiatePlace() {
    if (onDrawPile || game.playerHand.length === 0) return;
    if (!game.gameActive || gameState !== 'playing') return;
    if (placementMode) return; // Already in placement mode
    
    const card = game.playerHand[selectedCardIndex];
    if (!card) return;
    
    // Always enter placement mode - let player choose/confirm
    // Even if no valid piles, let them see and then shake when they try
    placementMode = true;
    placementCard = card;
    placementCardIndex = selectedCardIndex;
    placementPile = 1; // Start with pile 1
    
    updateIndicatorPosition();
}

// Execute the actual card placement
function executePlace(targetPile) {
    const card = placementMode ? placementCard : game.playerHand[selectedCardIndex];
    const cardIndex = placementMode ? placementCardIndex : selectedCardIndex;
    
    if (!card) return;
    
    // Get card position for animation
    const cardPos = getCardPosition(cardIndex, game.playerHand.length);
    
    // Exit placement mode first
    placementMode = false;
    placementCard = null;
    placementCardIndex = -1;
    
    // Play the card
    isCardPlopping = true;
    game.playCard(card, targetPile, cardPos.x, cardPos.y);
    
    // Adjust selected index if needed
    if (game.playerHand.length > 0) {
        selectedCardIndex = Math.min(selectedCardIndex, game.playerHand.length - 1);
    }
    
    updateIndicatorPosition();
}

// Confirm placement in placement mode
function confirmPlacement() {
    if (!placementMode) return;
    
    // Verify the placement is still valid
    const canPlay = placementPile === 1 
        ? game.canPlay(placementCard, game.pile1)
        : game.canPlay(placementCard, game.pile2);
    
    if (canPlay) {
        executePlace(placementPile);
    } else {
        // Can't play on this pile - shake and play bump sound
        if (typeof playSound !== 'undefined') {
            playSound('bump', { volume: 1.0 });
        }
        // Shake the cursor/card position
        if (typeof animManager !== 'undefined') {
            animManager.animateShake(cursorState);
        }
        // Stay in placement mode - let player try other pile or cancel
    }
}

// Cancel placement mode
function cancelPlacement() {
    placementMode = false;
    placementCard = null;
    placementCardIndex = -1;
    updateIndicatorPosition();
}

// Draw cards from the draw pile (activate when on draw pile)
function activateDrawPile() {
    if (!game.gameActive || gameState !== 'playing') return;
    
    if (onDrawPile) {
        // Actually draw the cards
        if (game.playerDrawPile.length > 0 && game.playerHand.length < 5) {
            game.drawCard();
            // After drawing, if draw pile empty or hand full, go back to cards
            if (game.playerDrawPile.length === 0 || game.playerHand.length >= 5) {
                onDrawPile = false;
                if (game.playerHand.length > 0) {
                    selectedCardIndex = game.playerHand.length - 1;
                }
            }
            updateIndicatorPosition();
        }
    } else {
        // Jump to draw pile first
        jumpToDrawPile();
    }
}

// Toggle sort mode
function toggleSortMode(enabled) {
    if (!onDrawPile && !placementMode) {
        sortMode = enabled;
    }
}

// Draw the keyboard indicator (called from main.js render loop)
function drawKeyboardIndicator(ctx) {
    // Show indicator during gameplay OR during waiting period
    if (!keyboardMode || gameState !== 'playing') return;
    if (!game.gameActive && !game.waitingForFlipClick) return;
    
    ctx.save();
    
    // Choose cursor image based on mode (grab cursor for sort mode OR placement mode)
    const cursorImg = (sortMode || placementMode) ? cursorGrabImg : cursorPointImg;
    
    // Draw the cursor image at the animated position
    if (cursorImg.complete && cursorImg.naturalWidth > 0) {
        const cursorSize = 32; // Display size
        const x = cursorState.x - cursorSize / 2;
        const y = cursorState.y;
        
        ctx.drawImage(cursorImg, x, y, cursorSize, cursorSize);
    }
    
    // Draw mode text below cursor
    if (onStartPile) {
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Press Z/Space to Start!', cursorState.x, cursorState.y + 36);
    } else if (sortMode) {
        ctx.fillStyle = '#ff6600';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('SORT', cursorState.x, cursorState.y + 36);
    }
    
    // Draw placement mode UI
    if (placementMode) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('← → to switch | Z/Space to place | ↓/C to cancel', cursorState.x, cursorState.y + 36);
    }
    
    // Draw "DRAW" label if on draw pile
    if (onDrawPile && !placementMode) {
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Press Z/Space to Draw', cursorState.x, cursorState.y + 36);
    }
    
    // Draw control hints at bottom of screen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const hintsY = canvas.height - 5;
    if (placementMode) {
        ctx.fillText('← → Switch Pile  |  Z/Space Place  |  ↓/C/Esc Cancel', canvas.width / 2, hintsY);
    } else {
        ctx.fillText('← → Navigate  |  ↑/Z/Space Place  |  X Sort  |  C Draw Pile', canvas.width / 2, hintsY);
    }
    
    ctx.restore();
}

// Draw the card being placed (renders to the side of the pile)
function drawPlacementCard(ctx) {
    if (!placementMode || !placementCard) return;
    
    // Draw the card hovering to the side of the selected pile
    const pilePos = getCenterPilePosition(placementPile);
    
    // Position: to the left of pile 1, to the right of pile 2
    const sideOffset = placementPile === 1 ? -CARD_WIDTH - 12 : CENTER_CARD_WIDTH + 12;
    const cardX = pilePos.x + sideOffset;
    const cardY = pilePos.y + (CENTER_CARD_HEIGHT - CARD_HEIGHT) / 2;
    
    // Draw at cursor position (which follows the shake animation)
    drawCard(placementCard, cursorState.x - CARD_WIDTH / 2, cardY, CARD_WIDTH, CARD_HEIGHT, false, 1.0);
}

// Keyboard event listeners
document.addEventListener('keydown', (e) => {
    // Don't handle if not in playing state (allow during waiting period too)
    if (gameState !== 'playing') return;
    
    // Allow controls during waiting period (for sorting) but not during actual gameplay unless game is active
    if (!game.gameActive && !game.waitingForFlipClick) return;
    
    // Check if game is paused
    const isPaused = typeof isGamePaused !== 'undefined' && isGamePaused();
    if (isPaused) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            enableKeyboardMode();
            selectPrevCard();
            break;
            
        case 'ArrowRight':
            e.preventDefault();
            enableKeyboardMode();
            selectNextCard();
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            // During waiting period, go to start pile
            if (keyboardMode && game.waitingForFlipClick && !game.gameActive) {
                onStartPile = true;
                updateIndicatorPosition();
            }
            // Up enters placement mode from hand (during gameplay)
            else if (keyboardMode && !placementMode && !onDrawPile) {
                initiatePlace();
            }
            break;
            
        case 'ArrowDown':
            e.preventDefault();
            // During waiting period, go back to hand from start pile
            if (keyboardMode && onStartPile && game.waitingForFlipClick) {
                onStartPile = false;
                if (game.playerHand.length > 0) {
                    selectedCardIndex = 0;
                }
                updateIndicatorPosition();
            }
            // Down exits placement mode back to hand (during gameplay)
            else if (keyboardMode && placementMode) {
                cancelPlacement();
            }
            break;
            
        case 'z':
        case 'Z':
        case ' ': // Spacebar
            e.preventDefault();
            if (keyboardMode) {
                // During waiting period, start the game if on start pile
                if (onStartPile && game.waitingForFlipClick) {
                    game.continueIntroCountdown();
                    if (typeof playSound !== 'undefined') {
                        playSound('shoosh', { volume: 1.0 });
                    }
                    onStartPile = false; // Reset state
                    disableKeyboardMode(); // Exit keyboard mode when starting
                }
                // Normal gameplay actions
                else if (placementMode) {
                    confirmPlacement();
                } else if (onDrawPile) {
                    activateDrawPile();
                } else {
                    initiatePlace();
                }
            }
            break;
            
        case 'x':
        case 'X':
            e.preventDefault();
            enableKeyboardMode(); // Enable keyboard mode when X is pressed
            if (keyboardMode && !onDrawPile && !placementMode) {
                toggleSortMode(true);
            }
            break;
            
        case 'c':
        case 'C':
            e.preventDefault();
            enableKeyboardMode();
            if (placementMode) {
                // Cancel placement and go back to hand
                cancelPlacement();
            } else {
                // Jump to draw pile when not in placement mode
                jumpToDrawPile();
            }
            break;
            
        case 'Escape':
            e.preventDefault();
            if (placementMode) {
                cancelPlacement();
            }
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'x':
        case 'X':
            toggleSortMode(false);
            break;
    }
});

// Mouse movement disables keyboard mode (but allow both during waiting period)
canvas.addEventListener('mousemove', (e) => {
    // During waiting period, allow both keyboard and mouse controls
    if (keyboardMode && !(game.waitingForFlipClick && !game.gameActive)) {
        disableKeyboardMode();
    }
});

// Expose functions globally for main.js to use
window.keyboardMode = () => keyboardMode;
window.drawKeyboardIndicator = drawKeyboardIndicator;
window.drawPlacementCard = drawPlacementCard;
window.selectedCardIndex = () => selectedCardIndex;
window.isPlacementMode = () => placementMode;
window.getPlacementCardIndex = () => placementCardIndex;

// Reset keyboard state when game stops
window.resetKeyboardController = function() {
    keyboardMode = false;
    sortMode = false;
    selectedCardIndex = 0;
    onDrawPile = false;
    onStartPile = false;
    placementMode = false;
    placementPile = 1;
    placementCard = null;
    placementCardIndex = -1;
    cursorState.x = 0;
    cursorState.y = 0;
};
