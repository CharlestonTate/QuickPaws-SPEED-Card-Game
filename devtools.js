// ============================================================
// DEVTOOLS - Animation Debug Display with Tracing
// ============================================================

let showAnimDebug = false;
let gamePaused = false;
let animHistory = []; // Persistent history cache
const MAX_HISTORY = 10;

// Toggle debug display with '\' key and pause with '=' key
document.addEventListener('keydown', (e) => {
    if (e.key === '\\') {
        showAnimDebug = !showAnimDebug;
        if (showAnimDebug) {
            console.log('%c[DEVTOOLS] Animation Debug ENABLED', 'color: #00ff00; font-weight: bold;');
        } else {
            console.log('%c[DEVTOOLS] Animation Debug DISABLED', 'color: #ff0000; font-weight: bold;');
        }
    }
    
    // Pause/Resume only works when debug menu is active
    if (e.key === '=' && showAnimDebug) {
        gamePaused = !gamePaused;
        if (gamePaused) {
            console.log('%c[DEVTOOLS] Game PAUSED', 'color: #ffff00; font-weight: bold;');
            // Notify game to pause
            if (typeof window.devtoolsPauseGame !== 'undefined') {
                window.devtoolsPauseGame();
            }
        } else {
            console.log('%c[DEVTOOLS] Game RESUMED', 'color: #00ff00; font-weight: bold;');
            // Notify game to resume
            if (typeof window.devtoolsResumeGame !== 'undefined') {
                window.devtoolsResumeGame();
            }
        }
    }
});

// Get pause state
function isGamePaused() {
    return gamePaused;
}

// Add animation to history cache (called from animation manager)
function traceAnimation(type, card, fromX, fromY, toX, toY) {
    const trace = {
        type: type,
        card: `${card.value}${card.suit}`,
        from: `(${Math.round(fromX)}, ${Math.round(fromY)})`,
        to: `(${Math.round(toX)}, ${Math.round(toY)})`,
        timestamp: Date.now()
    };
    
    animHistory.unshift(trace);
    if (animHistory.length > MAX_HISTORY) {
        animHistory.pop();
    }
    
    // Console trace for easy debugging
    console.log(
        `%c[ANIM:${type}]%c ${card.value}${card.suit} %c${fromX.toFixed(0)},${fromY.toFixed(0)} → ${toX.toFixed(0)},${toY.toFixed(0)}`,
        'color: #00aaff; font-weight: bold;',
        'color: #ffff00;',
        'color: #fff;'
    );
}

// Render animation debug info on canvas
function renderAnimDebug(ctx, animManager, canvasWidth) {
    if (!showAnimDebug) return;
    
    const activeAnims = animManager.getActiveAnimations();
    const boxWidth = 320;
    const boxX = canvasWidth - boxWidth - 10;
    
    // Background overlay
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    const boxHeight = 165 + (activeAnims.length * 70) + (animHistory.length * 15);
    ctx.fillRect(boxX, 10, boxWidth, boxHeight);
    
    // Border
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, 10, boxWidth, boxHeight);
    
    let y = 25;
    
    // === HEADER WITH PAUSE STATE ===
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 16px "Times New Roman"';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`ACTIVE (${activeAnims.length})`, boxX + 10, y);
    
    // Pause indicator
    if (gamePaused) {
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 14px "Times New Roman"';
        ctx.fillText('⏸ PAUSED', boxX + 220, y);
    }
    y += 25;
    
    ctx.font = '11px "Times New Roman"';
    if (activeAnims.length === 0) {
        ctx.fillStyle = '#666';
        ctx.fillText('No active animations', boxX + 10, y);
        y += 20;
    } else {
        activeAnims.forEach((anim, index) => {
            // Card name
            ctx.fillStyle = '#ffff00';
            ctx.fillText(`[${index}] ${anim.card.value}${anim.card.suit}`, boxX + 10, y);
            y += 14;
            
            // Position
            ctx.fillStyle = '#fff';
            ctx.fillText(`  pos: (${Math.round(anim.x)}, ${Math.round(anim.y)})`, boxX + 10, y);
            y += 14;
            
            // Scale & rotation
            ctx.fillText(`  s:${anim.scale.toFixed(2)} r:${Math.round(anim.rotation)}°`, boxX + 10, y);
            y += 14;
            
            // Type
            const type = anim.isDraw ? 'DRAW' : 
                        anim.isCPU ? 'CPU' : 
                        anim.isPlop ? 'PLOP' : 
                        anim.isReturn ? 'RETURN' : 
                        anim.isNewCard ? 'NEW_HAND' : 
                        anim.pileNum ? 'TO_PILE' : 'OTHER';
            ctx.fillStyle = '#00aaff';
            ctx.fillText(`  type: ${type}`, boxX + 10, y);
            y += 18;
        });
    }
    
    // === HISTORY SECTION ===
    y += 10;
    ctx.fillStyle = '#ff8800';
    ctx.font = 'bold 14px "Times New Roman"';
    ctx.fillText(`HISTORY (last ${MAX_HISTORY})`, boxX + 10, y);
    y += 20;
    
    ctx.font = '10px "Times New Roman"';
    if (animHistory.length === 0) {
        ctx.fillStyle = '#666';
        ctx.fillText('No history yet', boxX + 10, y);
    } else {
        animHistory.forEach((trace, index) => {
            const age = Date.now() - trace.timestamp;
            const alpha = Math.max(0.3, 1 - (age / 5000)); // Fade over 5 seconds
            
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillText(`${trace.type}: ${trace.card} ${trace.from}→${trace.to}`, boxX + 10, y);
            y += 13;
        });
    }
    
    // === HELP TEXT ===
    y += 5;
    ctx.fillStyle = '#666';
    ctx.font = '9px "Times New Roman"';
    ctx.fillText('Press \\ to toggle | = to pause/resume', boxX + 10, y);
    y += 11;
    ctx.fillText('Check console for detailed traces', boxX + 10, y);
    
    ctx.restore();
}

// Output all cards in a copyable format (call from console: showCards())
function showCards() {
    // Check if game is available
    if (typeof window.game === 'undefined' || !window.game) {
        console.log('%c[DEVTOOLS] Game not found!', 'color: #ff0000; font-weight: bold;');
        return;
    }
    
    const game = window.game;
    
    // Format card as string
    const formatCard = (card) => {
        if (!card) return 'null';
        return `${card.value}${card.suit}`;
    };
    
    // Format array of cards
    const formatCards = (cards) => {
        if (!cards || cards.length === 0) return '[]';
        return cards.map(formatCard).join(', ');
    };
    
    // Build output string
    let output = '\n';
    output += '=== ALL CARDS ===\n\n';
    
    output += 'CPU HAND:\n';
    output += formatCards(game.cpuHand) + '\n\n';
    
    output += 'PLAYER HAND:\n';
    output += formatCards(game.playerHand) + '\n\n';
    
    output += 'CENTER PILES:\n';
    output += `Pile 1: ${formatCard(game.pile1)}\n`;
    output += `Pile 2: ${formatCard(game.pile2)}\n\n`;
    
    output += 'CPU DRAW PILE:\n';
    output += `${game.cpuDrawPile.length} cards: ${formatCards(game.cpuDrawPile)}\n\n`;
    
    output += 'PLAYER DRAW PILE:\n';
    output += `${game.playerDrawPile.length} cards: ${formatCards(game.playerDrawPile)}\n\n`;
    
    output += 'CENTER DRAW PILES:\n';
    output += `Center Draw 1: ${game.centerDraw1.length} cards: ${formatCards(game.centerDraw1)}\n`;
    output += `Center Draw 2: ${game.centerDraw2.length} cards: ${formatCards(game.centerDraw2)}\n\n`;
    
    output += 'PILE STACKS (played cards):\n';
    output += `Pile 1 Stack: ${game.pile1Stack.length} cards: ${formatCards(game.pile1Stack)}\n`;
    output += `Pile 2 Stack: ${game.pile2Stack.length} cards: ${formatCards(game.pile2Stack)}\n\n`;
    
    output += '=== END ===\n';
    
    // Output to console with styling
    console.log('%c' + output, 'font-family: monospace; white-space: pre;');
    
    // Also copy to clipboard-friendly format
    const copyable = `CPU HAND: ${formatCards(game.cpuHand)}\n` +
                     `PLAYER HAND: ${formatCards(game.playerHand)}\n` +
                     `PILE 1: ${formatCard(game.pile1)}\n` +
                     `PILE 2: ${formatCard(game.pile2)}\n` +
                     `CPU DRAW: ${game.cpuDrawPile.length} cards - ${formatCards(game.cpuDrawPile)}\n` +
                     `PLAYER DRAW: ${game.playerDrawPile.length} cards - ${formatCards(game.playerDrawPile)}\n` +
                     `CENTER DRAW 1: ${game.centerDraw1.length} cards - ${formatCards(game.centerDraw1)}\n` +
                     `CENTER DRAW 2: ${game.centerDraw2.length} cards - ${formatCards(game.centerDraw2)}\n` +
                     `PILE 1 STACK: ${formatCards(game.pile1Stack)}\n` +
                     `PILE 2 STACK: ${formatCards(game.pile2Stack)}`;
    
    console.log('%c--- COPYABLE FORMAT (select and copy) ---', 'color: #00ff00; font-weight: bold;');
    console.log(copyable);
    
    return copyable;
}

// Make functions available globally
window.renderAnimDebug = renderAnimDebug;
window.traceAnimation = traceAnimation;
window.isGamePaused = isGamePaused;
window.showCards = showCards;

// Show help message
console.log('%c[DEVTOOLS] Type showCards() in console to see all cards', 'color: #00aaff; font-weight: bold;');

