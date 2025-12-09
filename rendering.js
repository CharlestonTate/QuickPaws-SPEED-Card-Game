// ============================================================
// RENDERING
// ============================================================

// draw cards
function drawRoundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Draw a playing card with optional transforms
function drawCard(card, x, y, width, height, isHovering = false, animScale = 1, rotation = 0) {
    ctx.save();
    
    // Apply transformations (rotation and scale from center)
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation * Math.PI / 180); // Convert degrees to radians
    ctx.scale(animScale, animScale);
    ctx.translate(-centerX, -centerY);
    
    // Card background
    drawRoundedRect(x, y, width, height, CARD_RADIUS);
    ctx.fillStyle = isHovering ? '#f0f0f0' : 'white';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Card text (value + suit)
    const isRed = card.suit === '♥' || card.suit === '♦';
    ctx.fillStyle = isRed ? '#dc143c' : '#000';
    ctx.font = `bold ${width * 0.3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(card.value + card.suit, x + width / 2, y + height / 2);
    
    ctx.restore();
}

// Draw deck pile (shows "DECK" text or empty state)
function drawDeckPile(x, y, width, height, hasCards, isHovering = false, label = 'DECK') {
    drawRoundedRect(x, y, width, height, CARD_RADIUS);
    ctx.fillStyle = hasCards ? (isHovering ? '#f0f0f0' : 'white') : '#555';
    ctx.fill();
    ctx.strokeStyle = isHovering ? '#00f' : '#000';
    ctx.lineWidth = isHovering ? 4 : 3;
    ctx.stroke();
    
    if (hasCards) {
        ctx.fillStyle = '#000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + width / 2, y + height / 2);
    }
}

// Draw UI button
function drawButton(btn, text, isHovering = false) {
    ctx.fillStyle = isHovering ? '#f0f0f0' : 'white';
    drawRoundedRect(btn.x, btn.y, btn.width, btn.height, 8);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#000';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, btn.x + btn.width / 2, btn.y + btn.height / 2);
}

