// ============================================================
// CREDITS SCREEN
// ============================================================

let creditsAnimState = {
    opacity: 0,
    y: canvas.height / 2
};

function initCredits() {
    creditsAnimState.opacity = 0;
    creditsAnimState.y = canvas.height / 2;
    
    // Animate credits in using animation manager
    if (typeof animManager !== 'undefined' && animManager.animateUI) {
        animManager.animateUI(creditsAnimState, {
            opacity: 1,
            y: canvas.height / 2 - 50
        }, 400);
    } else {
        // Fallback to direct anime.js
        anime({
            targets: creditsAnimState,
            opacity: 1,
            y: canvas.height / 2 - 50,
            duration: 400,
            easing: 'easeOutQuad'
        });
    }
}

function drawCredits() {
    ctx.save();
    ctx.globalAlpha = creditsAnimState.opacity;
    
    // Title
    ctx.fillStyle = 'black';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Credits', canvas.width / 2, creditsAnimState.y - 150);
    
    // Credits text
    ctx.font = '24px Arial';
    ctx.fillText('this is speed card game', canvas.width / 2, creditsAnimState.y - 50);
    ctx.fillText('Made with love by tate', canvas.width / 2, creditsAnimState.y + 20);
    ctx.fillText('Thanks for playing!', canvas.width / 2, creditsAnimState.y + 90);
    
    // Back button
    const backButtonX = canvas.width / 2;
    const backButtonY = canvas.height - 100;
    const backButtonWidth = 200;
    const backButtonHeight = 60;
    
    const isHovering = isPointInRect(mouseX, mouseY, backButtonX - backButtonWidth / 2, backButtonY - backButtonHeight / 2, backButtonWidth, backButtonHeight);
    
    drawRoundedRect(backButtonX - backButtonWidth / 2, backButtonY - backButtonHeight / 2, backButtonWidth, backButtonHeight, 12);
    ctx.fillStyle = isHovering ? '#f0f0f0' : 'white';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = '#000';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Back', backButtonX, backButtonY);
    
    ctx.restore();
}

function handleCreditsClick(x, y) {
    const backButtonX = canvas.width / 2;
    const backButtonY = canvas.height - 100;
    const backButtonWidth = 200;
    const backButtonHeight = 60;
    
    if (isPointInRect(x, y, backButtonX - backButtonWidth / 2, backButtonY - backButtonHeight / 2, backButtonWidth, backButtonHeight)) {
        // Animate out using animation manager
        if (typeof animManager !== 'undefined' && animManager.animateUI) {
            animManager.animateUI(creditsAnimState, {
                opacity: 0,
                y: canvas.height / 2
            }, 300, () => {
                gameState = 'mainmenu';
                if (typeof mainMenu !== 'undefined') {
                    mainMenu.show();
                }
            });
        } else {
            // Fallback to direct anime.js
            anime({
                targets: creditsAnimState,
                opacity: 0,
                y: canvas.height / 2,
                duration: 300,
                easing: 'easeOutQuad',
                complete: () => {
                    gameState = 'mainmenu';
                    if (typeof mainMenu !== 'undefined') {
                        mainMenu.show();
                    }
                }
            });
        }
        return true;
    }
    return false;
}

// Make functions globally accessible
window.initCredits = initCredits;
window.drawCredits = drawCredits;
window.handleCreditsClick = handleCreditsClick;

