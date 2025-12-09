// ============================================================
// MAIN GAME LOOP & EVENT HANDLERS
// ============================================================

// Main game loop / render function
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'initial') {
        // --- INITIAL SCREEN (for user input) ---
        
        // Title
        ctx.fillStyle = 'black';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Speed Demo', canvas.width / 2, canvas.height / 2 - 80);
        
        // Start button (to get user interaction for audio)
        const isHovering = isPointInRect(mouseX, mouseY, startButton.x, startButton.y, startButton.width, startButton.height);
        drawButton(startButton, 'Start', isHovering);
        
    } else if (gameState === 'splash') {
        // --- SPLASH SCREEN ---
        if (typeof splashScreen !== 'undefined') {
            splashScreen.draw(ctx);
        }
        
    } else if (gameState === 'mainmenu') {
        // --- MAIN MENU ---
        mainMenu.updateHover(mouseX, mouseY);
        mainMenu.draw();
        
    } else if (gameState === 'credits') {
        // --- CREDITS SCREEN ---
        if (typeof drawCredits !== 'undefined') {
            drawCredits();
        }
        
    // } else if (gameState === 'settings') {
    //     // --- SETTINGS MENU (COMMENTED OUT) ---
    //     if (typeof drawSettingsMenu !== 'undefined') {
    //         drawSettingsMenu();
    //     }
        
    } else if (gameState === 'playing' || gameState === 'gameover') {
        // --- GAME SCREEN ---
        
        // Get active animations first to check which cards are animating
        const activeAnims = animManager.getActiveAnimations();
        
        // Create sets of cards that are currently being animated
        const animatingPlayerCards = new Set();
        const animatingCPUCards = new Set();
        activeAnims.forEach(anim => {
            if (anim.isActive) {
                // Check which hand the card belongs to
                // Include ALL CPU card animations (isCPU flag, isReturn, isNewCard, isShift)
                if (anim.isCPU || game.cpuHand.includes(anim.card)) {
                    animatingCPUCards.add(anim.card);
                } else if (game.playerHand.includes(anim.card)) {
                    // Only track player hand animations for cards that are shifting or being added
                    if (anim.isNewCard || anim.isShift || anim.isReturn) {
                    animatingPlayerCards.add(anim.card);
                    }
                }
            }
        });
        
        // Draw CPU hand label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('CPU Hand:', 20, 30);
        
        // Draw CPU cards as white cards (hidden)
        for (let i = 0; i < game.cpuHand.length; i++) {
            // Skip cards that are currently being animated
            if (animatingCPUCards.has(game.cpuHand[i])) continue;
            
            const pos = getCardPosition(i, game.cpuHand.length, true);
            // Draw white card (face-down)
            drawRoundedRect(pos.x, pos.y, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // CPU indicator (shows which card CPU is considering)
            if (i === game.cpuCardIndex) {
                ctx.fillStyle = 'red';
                ctx.font = 'bold 30px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('▼', pos.x + CARD_WIDTH / 2, pos.y - 35);
            }
        }
        
        // Draw center piles
        const pile1Pos = getCenterPilePosition(1);
        const pile2Pos = getCenterPilePosition(2);
        
        if (game.pile1) {
            drawCard(game.pile1, pile1Pos.x, pile1Pos.y, CENTER_CARD_WIDTH, CENTER_CARD_HEIGHT);
        }
        if (game.pile2) {
            drawCard(game.pile2, pile2Pos.x, pile2Pos.y, CENTER_CARD_WIDTH, CENTER_CARD_HEIGHT);
        }
        
        // Draw deck piles
        const deck1Pos = getDeckPosition(1);
        const deck2Pos = getDeckPosition(2);
        drawDeckPile(deck1Pos.x, deck1Pos.y, CENTER_CARD_WIDTH, CENTER_CARD_HEIGHT, game.centerDraw1.length > 0);
        drawDeckPile(deck2Pos.x, deck2Pos.y, CENTER_CARD_WIDTH, CENTER_CARD_HEIGHT, game.centerDraw2.length > 0);
        
        // Draw player hand label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Your Hand:', 20, canvas.height - CARD_HEIGHT - 50);
        
        // Draw player draw pile (on the right side)
        const playerDrawPilePos = getPlayerDrawPilePosition();
        const isHoveringDrawPile = isPointInRect(mouseX, mouseY, playerDrawPilePos.x, playerDrawPilePos.y, CARD_WIDTH, CARD_HEIGHT) && 
                                   game.gameActive && game.playerDrawPile.length > 0 && game.playerHand.length < 5;
        drawDeckPile(playerDrawPilePos.x, playerDrawPilePos.y, CARD_WIDTH, CARD_HEIGHT, game.playerDrawPile.length > 0, isHoveringDrawPile, 'DRAW');
        
        // Draw CPU draw pile (top left)
        if (typeof getCPUDrawPilePosition !== 'undefined') {
            const cpuDrawPilePos = getCPUDrawPilePosition();
            drawDeckPile(cpuDrawPilePos.x, cpuDrawPilePos.y, CARD_WIDTH, CARD_HEIGHT, game.cpuDrawPile.length > 0, false, '');
        }
        
        // Draw reorder indicator (black bar) if reordering (only after hands revealed)
        if (game.handsRevealed && draggedCard && !isCardReturning && !isCardPlopping && reorderInsertIndex !== null) {
            const spacing = 15;
            const totalWidth = (game.playerHand.length * CARD_WIDTH) + ((game.playerHand.length - 1) * spacing);
            const startX = (canvas.width - totalWidth) / 2;
            const handY = canvas.height - CARD_HEIGHT - 20;
            
            let barX;
            if (reorderInsertIndex === 0) {
                barX = startX - spacing / 2;
            } else if (reorderInsertIndex === game.playerHand.length) {
                barX = startX + (reorderInsertIndex - 1) * (CARD_WIDTH + spacing) + CARD_WIDTH + spacing / 2;
            } else {
                barX = startX + reorderInsertIndex * (CARD_WIDTH + spacing) - spacing / 2;
            }
            
            // Draw black bar indicator
            ctx.fillStyle = '#000';
            ctx.fillRect(barX - 2, handY - 5, 4, CARD_HEIGHT + 10);
        }
        
        // Draw player cards (skip dragged card, cards being animated, and card in placement mode)
        if (game.handsRevealed) {
        for (let i = 0; i < game.playerHand.length; i++) {
            if (draggedCard && draggedCard.index === i) continue;
            
            // Skip cards that are currently being animated (they'll be drawn in the animation section)
            if (animatingPlayerCards.has(game.playerHand[i])) continue;
            
                // Skip card being placed in keyboard placement mode
                if (typeof isPlacementMode !== 'undefined' && isPlacementMode() && 
                    typeof getPlacementCardIndex !== 'undefined' && getPlacementCardIndex() === i) continue;
                
            const pos = getCardPosition(i, game.playerHand.length);
            const cardData = getCardAtPoint(mouseX, mouseY);
            const isHovering = cardData && cardData.index === i && !draggedCard && !isCardReturning && !isCardPlopping;
            drawCard(game.playerHand[i], pos.x, pos.y, CARD_WIDTH, CARD_HEIGHT, isHovering);
            }
        }
        
        // Draw animated cards (cards currently in motion)
        for (let anim of activeAnims) {
            if (anim.isActive) {
                const width = anim.pileNum || anim.isCPU ? CENTER_CARD_WIDTH : CARD_WIDTH;
                const height = anim.pileNum || anim.isCPU ? CENTER_CARD_HEIGHT : CARD_HEIGHT;
                
                // If this is a CPU card in hand being animated (not being played to pile), draw as white card (hidden)
                // Only show actual card value if it's being played to a pile (isCPU flag means it's going to pile)
                const isCPUCardInHand = game.cpuHand.includes(anim.card);
                const isCPUPlayingToPile = anim.isCPU; // isCPU flag means CPU is playing card to pile
                
                if (isCPUCardInHand && !isCPUPlayingToPile) {
                    // If hands aren't revealed yet, skip drawing CPU hand cards entirely
                    if (!game.handsRevealed) {
                        continue;
                    }
                    // CPU card in hand being animated (shift, return, new card) - draw as white card
                    ctx.save();
                    ctx.translate(anim.x + width / 2, anim.y + height / 2);
                    ctx.rotate(anim.rotation * Math.PI / 180);
                    ctx.scale(anim.scale, anim.scale);
                    ctx.translate(-(anim.x + width / 2), -(anim.y + height / 2));
                    drawRoundedRect(anim.x, anim.y, width, height, CARD_RADIUS);
                    ctx.fillStyle = '#ffffff';
                    ctx.fill();
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    ctx.restore();
                } else {
                    // Player card or CPU card being played to pile - show actual card
                drawCard(anim.card, anim.x, anim.y, width, height, false, anim.scale, anim.rotation);
                }
            }
        }
        
        // Draw dragged card on top of everything (but not if it's animating)
        if (draggedCard && !isCardReturning && !isCardPlopping) {
            const closestPile = getClosestValidPile(draggedCard.card, mouseX, mouseY);
            
            // Highlight valid pile with blue outline (only if not reordering)
            if (!isReordering) {
            if (closestPile === 1) {
                ctx.save();
                ctx.strokeStyle = '#00f';
                ctx.lineWidth = 5;
                drawRoundedRect(pile1Pos.x, pile1Pos.y, CENTER_CARD_WIDTH, CENTER_CARD_HEIGHT, CARD_RADIUS);
                ctx.stroke();
                ctx.restore();
            } else if (closestPile === 2) {
                ctx.save();
                ctx.strokeStyle = '#00f';
                ctx.lineWidth = 5;
                drawRoundedRect(pile2Pos.x, pile2Pos.y, CENTER_CARD_WIDTH, CENTER_CARD_HEIGHT, CARD_RADIUS);
                ctx.stroke();
                ctx.restore();
                }
            }
            
            drawCard(draggedCard.card, mouseX - dragOffset.x, mouseY - dragOffset.y, CARD_WIDTH, CARD_HEIGHT);
        }
        
        // New game button
        const btnHovering = isPointInRect(mouseX, mouseY, newGameButton.x, newGameButton.y, newGameButton.width, newGameButton.height);
        drawButton(newGameButton, 'New Game', btnHovering);
        
        // Draw keyboard controller indicator
        if (typeof drawKeyboardIndicator !== 'undefined') {
            drawKeyboardIndicator(ctx);
        }
        
        // Draw combo counter
        if (typeof comboSystem !== 'undefined') {
            comboSystem.draw(ctx);
        }
        
        // Draw card in placement mode (hovering over pile)
        if (typeof drawPlacementCard !== 'undefined') {
            drawPlacementCard(ctx);
        }
        
        // Draw flip pile click indicator (waiting for user to click to start countdown)
        if (game.waitingForFlipClick) {
            const deck1Pos = getDeckPosition(1);
            const deck2Pos = getDeckPosition(2);
            
            // Draw cursor indicator on LEFT pile
            const cursorImg = new Image();
            cursorImg.src = 'cursor_grab.png';
            const cursorSize = 48;
            ctx.drawImage(
                cursorImg, 
                deck1Pos.x + CENTER_CARD_WIDTH / 2 - cursorSize / 2, 
                deck1Pos.y + CENTER_CARD_HEIGHT / 2 - cursorSize / 2, 
                cursorSize, 
                cursorSize
            );
            
            // Highlight RIGHT pile with pulsing glow
            ctx.save();
            const pulseOpacity = 0.5 + Math.sin(Date.now() / 300) * 0.3;
            ctx.globalAlpha = pulseOpacity;
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 6;
            drawRoundedRect(deck2Pos.x - 5, deck2Pos.y - 5, CENTER_CARD_WIDTH + 10, CENTER_CARD_HEIGHT + 10, CARD_RADIUS);
            ctx.stroke();
            ctx.restore();
            
            // Draw instruction text
            ctx.save();
            ctx.fillStyle = '#000000';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const instructionText = 'Click the glowing pile to start!';
            ctx.strokeText(instructionText, canvas.width / 2, canvas.height / 2 + 180);
            ctx.fillText(instructionText, canvas.width / 2, canvas.height / 2 + 180);
            ctx.restore();
        }
        
        // Draw intro countdown (3, 2, 1, FLIP!)
        if (typeof introCountdown !== 'undefined' && introCountdown.text && introCountdown.opacity > 0) {
            ctx.save();
            ctx.globalAlpha = introCountdown.opacity;
            ctx.fillStyle = '#000000'; // black text
            ctx.strokeStyle = '#ffffff'; // white outline
            ctx.lineWidth = 6;
            ctx.font = `bold ${80 * introCountdown.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeText(introCountdown.text, canvas.width / 2, canvas.height / 2);
            ctx.fillText(introCountdown.text, canvas.width / 2, canvas.height / 2);
            ctx.restore();
        }
        
        // Game over screen (new class-based system)
        if (gameState === 'gameover' && typeof gameOverScreen !== 'undefined') {
            gameOverScreen.draw(ctx, mouseX, mouseY);
        }
    }
    
    // Render devtools overlay if enabled
    if (typeof renderAnimDebug !== 'undefined') {
        renderAnimDebug(ctx, animManager, canvas.width);
    }
    
    // Update and draw loading screen (if active)
    if (typeof loadingScreen !== 'undefined') {
        loadingScreen.update();
        loadingScreen.draw(ctx);
    }
    
    requestAnimationFrame(draw);
}


// ============================================================
// EVENT HANDLERS
// ============================================================

// --- Mouse Move ---
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    
    // Handle settings slider dragging (COMMENTED OUT)
    // if (isDraggingSlider && gameState === 'settings' && activeSliderKey) {
    //     if (typeof updateSliderFromMouse !== 'undefined') {
    //         updateSliderFromMouse(mouseX, mouseY, activeSliderKey);
    //     }
    // }
    
    // Update reorder indicator if dragging
    if (draggedCard && !isCardReturning && !isCardPlopping) {
        const closestPile = getClosestValidPile(draggedCard.card, mouseX, mouseY);
        const insertIndex = getReorderInsertIndex(mouseX, mouseY, draggedCard.index);
        isReordering = insertIndex !== null && closestPile === null;
        reorderInsertIndex = insertIndex;
        // Grabbing cursor handled by .grabbing class
    } else if (!isCardReturning && !isCardPlopping) {
        // Reset to default custom cursor (handled by CSS)
        canvas.style.cursor = '';
    }
});

// --- Mouse Down ---
canvas.addEventListener('mousedown', (e) => {
    // Check if game is paused by devtools
    const isPaused = typeof isGamePaused !== 'undefined' && isGamePaused();
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (gameState === 'initial') {
        // Initial start button clicked (to get user interaction)
        if (isPointInRect(x, y, startButton.x, startButton.y, startButton.width, startButton.height)) {
            userInteracted = true;
            // Resume audio context if needed
            if (typeof audioCtx !== 'undefined' && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            gameState = 'splash';
            if (typeof splashScreen !== 'undefined') {
                splashScreen.show();
            }
        }
    } else if (gameState === 'splash') {
        // Splash screen clicked - easter egg (only if clicking on text)
        if (typeof splashScreen !== 'undefined') {
            splashScreen.handleClick(x, y);
        }
    } else if (gameState === 'mainmenu') {
        // Main menu button clicked
        mainMenu.handleClick(x, y);
    } else if (gameState === 'credits') {
        // Credits screen interaction
        if (typeof handleCreditsClick !== 'undefined') {
            handleCreditsClick(x, y);
        }
    // } else if (gameState === 'settings') {
    //     // Settings menu interaction (COMMENTED OUT)
    //     if (typeof handleSettingsClick !== 'undefined') {
    //         const result = handleSettingsClick(x, y);
    //         if (result && result.dragging) {
    //             isDraggingSlider = true;
    //             activeSliderKey = result.key;
    //         }
    //     } else if (typeof initSettingsMenu !== 'undefined') {
    //         initSettingsMenu();
    //     }
    } else if (gameState === 'playing' || gameState === 'gameover') {
        // Game over screen interaction (if active)
        if (gameState === 'gameover' && typeof gameOverScreen !== 'undefined' && gameOverScreen.isActive) {
            gameOverScreen.handleClick(x, y);
            return; // Don't process other clicks while game over screen is active
        }
        
        // New game button clicked (returns to main menu)
        if (isPointInRect(x, y, newGameButton.x, newGameButton.y, newGameButton.width, newGameButton.height)) {
            // Stop the game completely before returning to menu
            game.stop();
            
            // Reset UI state
            draggedCard = null;
            draggedCardOriginalPos = null;
            dragOffset = { x: 0, y: 0 };
            isCardReturning = false;
            isCardPlopping = false;
            reorderInsertIndex = null;
            isReordering = false;
            canvas.style.cursor = '';
            canvas.classList.remove('grabbing');
            
            // Reset keyboard controller
            if (typeof resetKeyboardController !== 'undefined') {
                resetKeyboardController();
            }
            
            gameState = 'mainmenu';
            if (typeof mainMenu !== 'undefined') {
                mainMenu.show();
            }
            return;
        }
        
        // Check if waiting for flip pile click to start countdown
        if (game.waitingForFlipClick) {
            const deck2Pos = getDeckPosition(2); // Right pile
            if (isPointInRect(x, y, deck2Pos.x, deck2Pos.y, CENTER_CARD_WIDTH, CENTER_CARD_HEIGHT)) {
                // User clicked the right flip pile - continue the countdown!
                game.continueIntroCountdown();
                if (typeof playSound !== 'undefined') {
                    playSound('shoosh', { volume: 1.0 });
                }
                return; // Only return if we clicked the pile to start
            }
            // Don't return - allow card dragging during waiting period!
        }
        
        // Player draw pile clicked
        if (game.gameActive && !isPaused) {
            const playerDrawPilePos = getPlayerDrawPilePosition();
            if (isPointInRect(x, y, playerDrawPilePos.x, playerDrawPilePos.y, CARD_WIDTH, CARD_HEIGHT)) {
                if (game.playerDrawPile.length > 0 && game.playerHand.length < 5) {
                    game.drawCard();
                }
                return;
            }
        }
        
        // Don't allow dragging if game is paused
        if (isPaused) return;
        
        // Start dragging a card (allow during gameplay OR waiting period)
        const cardData = getCardAtPoint(x, y);
        
        if (cardData && (game.gameActive || game.waitingForFlipClick) && !isCardPlopping) {
            
            // Allow picking up a new card even during return animation
            // If a card is returning, cancel that animation and pick up the new one
            if (isCardReturning) {
                isCardReturning = false;
                // The old card's return animation will complete naturally, we just ignore its callback
            }
            
            const pos = getCardPosition(cardData.index, game.playerHand.length);
            draggedCard = cardData;
            draggedCardOriginalPos = { x: pos.x, y: pos.y }; // Store original position
            dragOffset = {
                x: x - pos.x,
                y: y - pos.y
            };
            reorderInsertIndex = null;
            isReordering = false;
            canvas.classList.add('grabbing');
        }
    }
});

// --- Mouse Up ---
canvas.addEventListener('mouseup', (e) => {
    // Stop dragging slider if active (COMMENTED OUT - settings removed)
    // if (isDraggingSlider) {
    //     isDraggingSlider = false;
    //     activeSliderKey = null;
    // }
    
    // Check if game is paused by devtools
    const isPaused = typeof isGamePaused !== 'undefined' && isGamePaused();
    
    if (draggedCard && !isCardReturning && !isCardPlopping) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // If paused, just return card to original position
        if (isPaused) {
            const currentX = x - dragOffset.x;
            const currentY = y - dragOffset.y;
            const returnCard = draggedCard.card;
            const returnIndex = draggedCard.index;
            
            isCardReturning = true;
            canvas.style.cursor = '';
            
            animManager.animateCardReturn(
                returnCard,
                currentX,
                currentY,
                draggedCardOriginalPos.x,
                draggedCardOriginalPos.y,
                returnIndex,
                () => {
                    // Only clear state if still in returning state (not interrupted by new drag)
                    if (isCardReturning) {
                    isCardReturning = false;
                    draggedCard = null;
                    draggedCardOriginalPos = null;
                    }
                }
            );
            
            canvas.classList.remove('grabbing');
            return;
        }
        
        const closestPile = getClosestValidPile(draggedCard.card, x, y);
        const insertIndex = getReorderInsertIndex(x, y, draggedCard.index);
        
        // Check if we're reordering (insert index valid) or playing (closest pile valid)
        if (insertIndex !== null && closestPile === null) {
            // Reorder the cards
            const oldIndex = draggedCard.index;
            const card = draggedCard.card;
            
            // Store current positions before any changes
            const oldPositions = [];
            for (let i = 0; i < game.playerHand.length; i++) {
                oldPositions.push(getCardPosition(i, game.playerHand.length));
            }
            
            // Remove card from old position
            game.playerHand.splice(oldIndex, 1);
            
            // Adjust insert index if needed (since we removed one card)
            const newIndex = insertIndex > oldIndex ? insertIndex - 1 : insertIndex;
            
            // Insert at new position
            game.playerHand.splice(newIndex, 0, card);
            
            // Calculate new positions after reordering
            const newPositions = [];
            for (let i = 0; i < game.playerHand.length; i++) {
                newPositions.push(getCardPosition(i, game.playerHand.length));
            }
            
            // Create mapping: newIndex -> oldIndex
            // After removal, cards shift left. After insertion, some shift right.
            const indexMap = [];
            for (let i = 0; i < game.playerHand.length; i++) {
                if (i === newIndex) {
                    indexMap[i] = oldIndex; // Dragged card
                } else if (i < newIndex) {
                    // Cards before insertion point
                    if (i < oldIndex) {
                        indexMap[i] = i; // No change
                    } else {
                        indexMap[i] = i + 1; // Shifted left by removal
                    }
                } else {
                    // Cards after insertion point
                    if (i <= oldIndex) {
                        indexMap[i] = i - 1; // Shifted right by insertion
                    } else {
                        indexMap[i] = i; // Net: no change (shifted left then right)
                    }
                }
            }
            
            // Animate all cards that need to move
            for (let i = 0; i < game.playerHand.length; i++) {
                if (i === newIndex) {
                    // Animate the dragged card from current mouse position to its new position
                    animManager.animateCardShift(
                        card,
                        x - dragOffset.x,
                        y - dragOffset.y,
                        newPositions[i].x,
                        newPositions[i].y,
                        i
                    );
                } else {
                    // Get old position from mapping
                    const oldPosIdx = indexMap[i];
                    const oldPos = oldPositions[oldPosIdx];
                    const newPos = newPositions[i];
                    
                    // Only animate if position changed
                    if (oldPos && (Math.abs(oldPos.x - newPos.x) > 1 || Math.abs(oldPos.y - newPos.y) > 1)) {
                        animManager.animateCardShift(
                            game.playerHand[i],
                            oldPos.x,
                            oldPos.y,
                            newPos.x,
                            newPos.y,
                            i
                        );
                    }
                }
            }
            
            draggedCard = null;
            draggedCardOriginalPos = null;
            reorderInsertIndex = null;
            isReordering = false;
            canvas.classList.remove('grabbing');
        } else if (closestPile) {
            // Play the card with animation
            isCardPlopping = true;
            canvas.style.cursor = '';
            game.playCard(draggedCard.card, closestPile, x - dragOffset.x, y - dragOffset.y);
            draggedCard = null;
            draggedCardOriginalPos = null;
            reorderInsertIndex = null;
            isReordering = false;
            canvas.classList.remove('grabbing');
        } else {
            // No valid pile - animate card back to original position
            const currentX = x - dragOffset.x;
            const currentY = y - dragOffset.y;
            const returnCard = draggedCard.card;
            const returnIndex = draggedCard.index;
            
            // Check if player tried to play to a pile but failed (not reordering)
            // If both closestPile and insertIndex are null, player tried to play but couldn't
            const triedToPlay = closestPile === null && insertIndex === null;
            
            isCardReturning = true;
            canvas.style.cursor = '';
            
            animManager.animateCardReturn(
                returnCard,
                currentX,
                currentY,
                draggedCardOriginalPos.x,
                draggedCardOriginalPos.y,
                returnIndex,
                () => {
                    // Animation complete - only clear if not interrupted by new drag
                    if (isCardReturning) {
                    isCardReturning = false;
                    draggedCard = null;
                    draggedCardOriginalPos = null;
                    reorderInsertIndex = null;
                    isReordering = false;
                    }
                    
                    // If player tried to play but couldn't, check for deadlock
                    if (triedToPlay && gameState === 'playing' && game.gameActive) {
                        setTimeout(() => {
                            if (gameState === 'playing' && game.gameActive) {
                                if (!game.canPlayerPlay() && !game.canCPUPlay()) {
                                    game.checkForDeadlock();
                                }
                            }
                        }, 100);
                    }
                }
            );
            
            canvas.classList.remove('grabbing');
        }
    }
});

// --- Mouse Leave Canvas ---
canvas.addEventListener('mouseleave', () => {
    if (draggedCard && draggedCardOriginalPos && !isCardReturning && !isCardPlopping) {
        // Animate card back to original position when mouse leaves canvas
        const currentX = mouseX - dragOffset.x;
        const currentY = mouseY - dragOffset.y;
        const returnCard = draggedCard.card;
        const returnIndex = draggedCard.index;
        
        isCardReturning = true;
        canvas.style.cursor = '';
        
        animManager.animateCardReturn(
            returnCard,
            currentX,
            currentY,
            draggedCardOriginalPos.x,
            draggedCardOriginalPos.y,
            returnIndex,
            () => {
                // Animation complete - only clear if not interrupted by new drag
                if (isCardReturning) {
                isCardReturning = false;
                draggedCard = null;
                draggedCardOriginalPos = null;
                reorderInsertIndex = null;
                isReordering = false;
                }
            }
        );
        
        canvas.classList.remove('grabbing');
    }
});


// ============================================================
// INITIALIZATION
// ============================================================

// start the main game loop
draw();
