// ============================================================
// SETTINGS SYSTEM
// ============================================================

// Default settings
const defaultSettings = {
    soundVolume: 0.6,
    musicVolume: 0.4,
    cpuSpeed: 1000, // CPU play interval in ms
    showCPUIndicator: true,
    cardAnimations: true
};

// Current settings (load from localStorage or use defaults)
let settings = { ...defaultSettings };

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('speedGameSettings');
    if (saved) {
        try {
            settings = { ...defaultSettings, ...JSON.parse(saved) };
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
    }
}

// Save settings to localStorage
function saveSettings() {
    try {
        localStorage.setItem('speedGameSettings', JSON.stringify(settings));
    } catch (e) {
        console.warn('Failed to save settings:', e);
    }
}

// Update a setting
function updateSetting(key, value) {
    if (settings.hasOwnProperty(key)) {
        settings[key] = value;
        saveSettings();
        return true;
    }
    return false;
}

// Get a setting
function getSetting(key) {
    return settings[key];
}

// Reset settings to defaults
function resetSettings() {
    settings = { ...defaultSettings };
    saveSettings();
}

// Initialize settings on load
loadSettings();

// Settings menu UI
let settingsButtons = [];
let backButton = null;

function initSettingsMenu() {
    const centerX = canvas.width / 2;
    const startY = canvas.height / 2 - 100;
    const spacing = 60;
    
    // Back button
    backButton = {
        x: centerX,
        y: canvas.height - 100,
        width: 200,
        height: 60,
        text: 'Back',
        animState: { scale: 0, opacity: 0 }
    };
    
    // Animate back button in
    anime({
        targets: backButton.animState,
        scale: [0, 1.1, 1],
        opacity: [0, 1],
        duration: 400,
        delay: 300,
        easing: 'easeOutBack'
    });
}

function drawSettingsMenu() {
    ctx.save();
    
    // Title
    ctx.fillStyle = 'black';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Settings', canvas.width / 2, 100);
    
    const centerX = canvas.width / 2;
    const startY = canvas.height / 2 - 100;
    const spacing = 60;
    
    // Sound Volume
    drawSettingRow('Sound Volume', settings.soundVolume, 0, 1, centerX, startY, 'soundVolume');
    
    // Music Volume
    drawSettingRow('Music Volume', settings.musicVolume, 0, 1, centerX, startY + spacing, 'musicVolume');
    
    // CPU Speed
    const cpuSpeedDisplay = (2000 - settings.cpuSpeed) / 10; // Convert to 0-100 scale
    drawSettingRow('CPU Speed', cpuSpeedDisplay, 0, 100, centerX, startY + spacing * 2, 'cpuSpeed', true);
    
    // Show CPU Indicator
    drawToggleSetting('Show CPU Indicator', settings.showCPUIndicator, centerX, startY + spacing * 3, 'showCPUIndicator');
    
    // Card Animations
    drawToggleSetting('Card Animations', settings.cardAnimations, centerX, startY + spacing * 4, 'cardAnimations');
    
    // Reset button
    const resetY = startY + spacing * 5 + 40;
    const resetHovering = isPointInRect(mouseX, mouseY, centerX - 100, resetY - 20, 200, 40);
    drawRoundedRect(centerX - 100, resetY - 20, 200, 40, 8);
    ctx.fillStyle = resetHovering ? '#ffcccc' : '#ffeeee';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Reset to Defaults', centerX, resetY);
    
    // Back button
    if (backButton) {
        ctx.save();
        ctx.globalAlpha = backButton.animState.opacity;
        ctx.translate(backButton.x, backButton.y);
        ctx.scale(backButton.animState.scale, backButton.animState.scale);
        const backHovering = isPointInRect(mouseX, mouseY, backButton.x - backButton.width / 2, backButton.y - backButton.height / 2, backButton.width, backButton.height);
        drawRoundedRect(-backButton.width / 2, -backButton.height / 2, backButton.width, backButton.height, 12);
        ctx.fillStyle = backHovering ? '#f0f0f0' : 'white';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(backButton.text, 0, 0);
        ctx.restore();
    }
    
    ctx.restore();
}

function drawSettingRow(label, value, min, max, x, y, settingKey, isSpeed = false) {
    const barWidth = 400;
    const barHeight = 30;
    const barX = x - barWidth / 2;
    const barY = y - barHeight / 2;
    
    // Label
    ctx.fillStyle = 'black';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, barX, y - 40);
    
    // Value display
    ctx.textAlign = 'right';
    let displayValue = isSpeed ? Math.round((2000 - value) / 10) : Math.round(value * 100);
    ctx.fillText(`${displayValue}%`, barX + barWidth, y - 40);
    
    // Slider bar background
    drawRoundedRect(barX, barY, barWidth, barHeight, 8);
    ctx.fillStyle = '#ddd';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Slider fill
    const fillWidth = (value - min) / (max - min) * barWidth;
    drawRoundedRect(barX, barY, fillWidth, barHeight, 8);
    ctx.fillStyle = '#4CAF50';
    ctx.fill();
    
    // Slider handle
    const handleX = barX + fillWidth - 10;
    const handleY = barY;
    const handleWidth = 20;
    const handleHeight = barHeight;
    const handleHovering = isPointInRect(mouseX, mouseY, handleX, handleY, handleWidth, handleHeight);
    
    drawRoundedRect(handleX, handleY, handleWidth, handleHeight, 8);
    ctx.fillStyle = handleHovering ? '#45a049' : '#4CAF50';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawToggleSetting(label, value, x, y, settingKey) {
    const toggleWidth = 60;
    const toggleHeight = 30;
    const toggleX = x + 200;
    const toggleY = y - toggleHeight / 2;
    
    // Label
    ctx.fillStyle = 'black';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x - 200, y);
    
    // Toggle background
    drawRoundedRect(toggleX, toggleY, toggleWidth, toggleHeight, 15);
    ctx.fillStyle = value ? '#4CAF50' : '#ccc';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Toggle handle
    const handleSize = toggleHeight - 6;
    const handleX = value ? toggleX + toggleWidth - handleSize - 3 : toggleX + 3;
    const handleY = toggleY + 3;
    
    drawRoundedRect(handleX, handleY, handleSize, handleSize, handleSize / 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function handleSettingsClick(x, y) {
    const centerX = canvas.width / 2;
    const startY = canvas.height / 2 - 100;
    const spacing = 60;
    
    // Check sliders
    const barWidth = 400;
    const barHeight = 30;
    
    // Sound Volume slider
    if (y >= startY - barHeight / 2 && y <= startY + barHeight / 2) {
        const barX = centerX - barWidth / 2;
        if (x >= barX && x <= barX + barWidth) {
            const newValue = Math.max(0, Math.min(1, (x - barX) / barWidth));
            updateSetting('soundVolume', newValue);
            return { dragging: true, key: 'soundVolume' };
        }
    }
    
    // Music Volume slider
    if (y >= startY + spacing - barHeight / 2 && y <= startY + spacing + barHeight / 2) {
        const barX = centerX - barWidth / 2;
        if (x >= barX && x <= barX + barWidth) {
            const newValue = Math.max(0, Math.min(1, (x - barX) / barWidth));
            updateSetting('musicVolume', newValue);
            return { dragging: true, key: 'musicVolume' };
        }
    }
    
    // CPU Speed slider
    if (y >= startY + spacing * 2 - barHeight / 2 && y <= startY + spacing * 2 + barHeight / 2) {
        const barX = centerX - barWidth / 2;
        if (x >= barX && x <= barX + barWidth) {
            const newValue = 2000 - ((x - barX) / barWidth) * 2000; // Invert: 0 = fast, 100 = slow
            updateSetting('cpuSpeed', Math.max(500, Math.min(2000, newValue)));
            return { dragging: true, key: 'cpuSpeed' };
        }
    }
    
    // Toggle buttons
    const toggleX = centerX + 200;
    const toggleWidth = 60;
    const toggleHeight = 30;
    
    // Show CPU Indicator toggle
    if (y >= startY + spacing * 3 - toggleHeight / 2 && y <= startY + spacing * 3 + toggleHeight / 2) {
        if (x >= toggleX && x <= toggleX + toggleWidth) {
            updateSetting('showCPUIndicator', !settings.showCPUIndicator);
            return;
        }
    }
    
    // Card Animations toggle
    if (y >= startY + spacing * 4 - toggleHeight / 2 && y <= startY + spacing * 4 + toggleHeight / 2) {
        if (x >= toggleX && x <= toggleX + toggleWidth) {
            updateSetting('cardAnimations', !settings.cardAnimations);
            return;
        }
    }
    
    // Reset button
    const resetY = startY + spacing * 5 + 40;
    if (isPointInRect(x, y, centerX - 100, resetY - 20, 200, 40)) {
        resetSettings();
        return;
    }
    
    // Back button
    if (backButton && isPointInRect(x, y, backButton.x - backButton.width / 2, backButton.y - backButton.height / 2, backButton.width, backButton.height)) {
        gameState = 'mainmenu';
        mainMenu.show();
        return;
    }
}

// Make settings accessible globally
window.settings = settings;
window.updateSetting = updateSetting;
window.getSetting = getSetting;
window.resetSettings = resetSettings;
function updateSliderFromMouse(x, y, key) {
    const centerX = canvas.width / 2;
    const startY = canvas.height / 2 - 100;
    const spacing = 60;
    const barWidth = 400;
    const barHeight = 30;
    
    let barY;
    if (key === 'soundVolume') {
        barY = startY;
    } else if (key === 'musicVolume') {
        barY = startY + spacing;
    } else if (key === 'cpuSpeed') {
        barY = startY + spacing * 2;
    } else {
        return;
    }
    
    if (y >= barY - barHeight / 2 && y <= barY + barHeight / 2) {
        const barX = centerX - barWidth / 2;
        if (x >= barX && x <= barX + barWidth) {
            if (key === 'cpuSpeed') {
                const newValue = 2000 - ((x - barX) / barWidth) * 2000;
                updateSetting(key, Math.max(500, Math.min(2000, newValue)));
            } else {
                const newValue = Math.max(0, Math.min(1, (x - barX) / barWidth));
                updateSetting(key, newValue);
            }
        }
    }
}

window.drawSettingsMenu = drawSettingsMenu;
window.handleSettingsClick = handleSettingsClick;
window.initSettingsMenu = initSettingsMenu;
window.updateSliderFromMouse = updateSliderFromMouse;

