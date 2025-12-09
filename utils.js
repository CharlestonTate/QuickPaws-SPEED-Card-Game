// ============================================================
// UTILITY / HELPER FUNCTIONS
// ============================================================

// Get position for card in hand (centered horizontally)
function getCardPosition(index, total, isCPU = false) {
    const spacing = 15;
    const totalWidth = (total * CARD_WIDTH) + ((total - 1) * spacing);
    const startX = (canvas.width - totalWidth) / 2;
    const y = isCPU ? 20 : canvas.height - CARD_HEIGHT - 20;
    return {
        x: startX + (index * (CARD_WIDTH + spacing)),
        y: y
    };
}

// Get position for center pile cards
function getCenterPilePosition(pileNum) {
    const centerY = canvas.height / 2 - CENTER_CARD_HEIGHT / 2;
    if (pileNum === 1) {
        return { x: canvas.width / 2 - CENTER_CARD_WIDTH - 10, y: centerY };
    } else {
        return { x: canvas.width / 2 + 10, y: centerY };
    }
}

// Get position for deck piles (left and right of center)
function getDeckPosition(deckNum) {
    const centerY = canvas.height / 2 - CENTER_CARD_HEIGHT / 2;
    if (deckNum === 1) {
        return { x: canvas.width / 2 - CENTER_CARD_WIDTH - 10 - 100 - CENTER_CARD_WIDTH - 20, y: centerY };
    } else {
        return { x: canvas.width / 2 + 10 + 100 + CENTER_CARD_WIDTH + 20, y: centerY };
    }
}

// Get position for player draw pile (beside player hand on the right)
function getPlayerDrawPilePosition() {
    return {
        x: canvas.width - CARD_WIDTH - 20,
        y: canvas.height - CARD_HEIGHT - 20
    };
}

// Get position for CPU draw pile (top left)
function getCPUDrawPilePosition() {
    return {
        x: 20,
        y: 20
    };
}

// Check if point is inside rectangle (collision detection)
function isPointInRect(px, py, x, y, width, height) {
    return px >= x && px <= x + width && py >= y && py <= y + height;
}

// Get card at mouse position (for player hand only)
function getCardAtPoint(x, y) {
    // Allow during gameplay OR waiting period
    if (gameState !== 'playing' || (!game.gameActive && !game.waitingForFlipClick)) return null;
    
    for (let i = 0; i < game.playerHand.length; i++) {
        const pos = getCardPosition(i, game.playerHand.length);
        if (isPointInRect(x, y, pos.x, pos.y, CARD_WIDTH, CARD_HEIGHT)) {
            return { card: game.playerHand[i], index: i };
        }
    }
    return null;
}

// Get insert index for reordering (returns index where card should be inserted)
function getReorderInsertIndex(x, y, draggedIndex) {
    // Allow during gameplay OR waiting period
    if (gameState !== 'playing' || (!game.gameActive && !game.waitingForFlipClick) || !draggedCard) return null;
    
    const handY = canvas.height - CARD_HEIGHT - 20;
    // Only allow reordering if mouse is in the hand area (larger hitbox)
    if (y < handY - 100 || y > handY + CARD_HEIGHT + 100) return null;
    
    const spacing = 15;
    const totalWidth = (game.playerHand.length * CARD_WIDTH) + ((game.playerHand.length - 1) * spacing);
    const startX = (canvas.width - totalWidth) / 2;
    
    // the bigger the hitbox, the bigger the radius for sorting cards. (180 is the current sweet spot)
    const hitboxWidth = 180;
    
    // Find which gap the mouse is over
    for (let i = 0; i <= game.playerHand.length; i++) {
        let gapX;
        if (i === 0) {
            gapX = startX - spacing / 2;
        } else if (i === game.playerHand.length) {
            gapX = startX + (i - 1) * (CARD_WIDTH + spacing) + CARD_WIDTH + spacing / 2;
        } else {
            gapX = startX + i * (CARD_WIDTH + spacing) - spacing / 2;
        }
        
        if (x >= gapX - hitboxWidth / 2 && x <= gapX + hitboxWidth / 2) {
            // Don't allow inserting at the same position
            if (i === draggedIndex || i === draggedIndex + 1) return null;
            return i;
        }
    }
    
    return null;
}

// Find closest valid pile for a dragged card
function getClosestValidPile(card, x, y) {
    const pile1Pos = getCenterPilePosition(1);
    const pile2Pos = getCenterPilePosition(2);
    
    const pile1CenterX = pile1Pos.x + CENTER_CARD_WIDTH / 2;
    const pile1CenterY = pile1Pos.y + CENTER_CARD_HEIGHT / 2;
    const pile2CenterX = pile2Pos.x + CENTER_CARD_WIDTH / 2;
    const pile2CenterY = pile2Pos.y + CENTER_CARD_HEIGHT / 2;
    
    const dist1 = Math.sqrt(Math.pow(x - pile1CenterX, 2) + Math.pow(y - pile1CenterY, 2));
    const dist2 = Math.sqrt(Math.pow(x - pile2CenterX, 2) + Math.pow(y - pile2CenterY, 2));
    
    const proximityThreshold = 200;
    
    let closestPile = null;
    let closestDist = Infinity;
    
    if (dist1 < proximityThreshold && game.canPlay(card, game.pile1)) {
        closestPile = 1;
        closestDist = dist1;
    }
    
    if (dist2 < proximityThreshold && game.canPlay(card, game.pile2)) {
        if (dist2 < closestDist) {
            closestPile = 2;
        }
    }
    
    return closestPile;
}











