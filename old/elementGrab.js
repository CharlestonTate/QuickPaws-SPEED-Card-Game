(function() {
    'use strict';
    
    // Configuration
    const config = {
        enabled: false,
        locked: false,
        toggleKey: 'I', // Ctrl+Shift+I
        highlightColor: 'rgba(0, 150, 255, 0.3)',
        borderColor: '#0096ff',
        panelBgColor: '#1e1e1e',
        panelTextColor: '#ffffff',
        zIndex: 999999
    };
    
    // State
    let currentElement = null;
    let lockedElement = null;
    let overlay = null;
    let panel = null;
    let styles = null;
    
    // Initialize
    function init() {
        createStyles();
        createOverlay();
        createPanel();
        attachEventListeners();
        console.log('🔍 ElementGrab initialized! Press Ctrl+Shift+I to toggle inspector.');
    }
    
    // Create CSS styles
    function createStyles() {
        if (styles) return;
        
        styles = document.createElement('style');
        styles.innerHTML = `
            .elementgrab-overlay {
                position: fixed;
                pointer-events: none;
                border: 3px solid ${config.borderColor};
                background: ${config.highlightColor};
                z-index: ${config.zIndex};
                transition: all 0.1s ease;
                box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.3);
            }
            
            .elementgrab-panel {
                position: fixed;
                top: 10px;
                right: 10px;
                width: 400px;
                max-height: 90vh;
                background: ${config.panelBgColor};
                color: ${config.panelTextColor};
                border-radius: 8px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                font-family: 'Courier New', monospace;
                font-size: 12px;
                z-index: ${config.zIndex + 1};
                overflow: hidden;
                display: none;
                animation: slideIn 0.3s ease;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .elementgrab-panel.active {
                display: flex;
                flex-direction: column;
            }
            
            .elementgrab-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 15px;
                font-weight: bold;
                font-size: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #000;
            }
            
            .elementgrab-close {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }
            
            .elementgrab-close:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            
            .elementgrab-content {
                flex: 1;
                overflow-y: auto;
                padding: 15px;
            }
            
            .elementgrab-section {
                margin-bottom: 20px;
            }
            
            .elementgrab-section-title {
                color: #667eea;
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 8px;
                border-bottom: 1px solid #333;
                padding-bottom: 5px;
            }
            
            .elementgrab-info-row {
                display: flex;
                margin-bottom: 5px;
                line-height: 1.5;
            }
            
            .elementgrab-label {
                color: #888;
                min-width: 120px;
                flex-shrink: 0;
            }
            
            .elementgrab-value {
                color: #4ec9b0;
                word-break: break-all;
                flex: 1;
            }
            
            .elementgrab-tag {
                color: #569cd6;
                font-weight: bold;
            }
            
            .elementgrab-string {
                color: #ce9178;
            }
            
            .elementgrab-number {
                color: #b5cea8;
            }
            
            .elementgrab-attribute {
                color: #9cdcfe;
            }
            
            .elementgrab-style-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 5px;
                font-size: 11px;
            }
            
            .elementgrab-footer {
                background: #2d2d2d;
                padding: 10px 15px;
                border-top: 1px solid #000;
                font-size: 11px;
                color: #888;
            }
            
            .elementgrab-locked-indicator {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #4ec9b0;
                margin-right: 5px;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }
            
            .elementgrab-content::-webkit-scrollbar {
                width: 8px;
            }
            
            .elementgrab-content::-webkit-scrollbar-track {
                background: #2d2d2d;
            }
            
            .elementgrab-content::-webkit-scrollbar-thumb {
                background: #555;
                border-radius: 4px;
            }
            
            .elementgrab-content::-webkit-scrollbar-thumb:hover {
                background: #666;
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Create overlay element
    function createOverlay() {
        overlay = document.createElement('div');
        overlay.className = 'elementgrab-overlay';
        overlay.style.display = 'none';
        document.body.appendChild(overlay);
    }
    
    // Create panel
    function createPanel() {
        panel = document.createElement('div');
        panel.className = 'elementgrab-panel';
        
        panel.innerHTML = `
            <div class="elementgrab-header">
                <div>
                    <span class="elementgrab-locked-indicator" style="display: none;"></span>
                    🔍 ElementGrab Inspector
                </div>
                <button class="elementgrab-close">✕</button>
            </div>
            <div class="elementgrab-content" id="elementgrab-content">
                <div style="color: #888; text-align: center; padding: 40px 20px;">
                    Hover over elements to inspect them<br>
                    Click to lock inspection<br>
                    <br>
                    <strong>Ctrl+Shift+I</strong> to toggle
                </div>
            </div>
            <div class="elementgrab-footer">
                Press ESC to unlock | Click outside to clear
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Close button
        panel.querySelector('.elementgrab-close').addEventListener('click', () => {
            toggleInspector();
        });
    }
    
    // Attach event listeners
    function attachEventListeners() {
        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === config.toggleKey) {
                e.preventDefault();
                toggleInspector();
            }
            
            if (e.key === 'Escape' && config.enabled) {
                unlockElement();
            }
        });
        
        // Mouse move for hover inspection
        document.addEventListener('mousemove', (e) => {
            if (!config.enabled || config.locked) return;
            
            const element = document.elementFromPoint(e.clientX, e.clientY);
            
            // Ignore inspector UI
            if (element && !isInspectorElement(element)) {
                inspectElement(element);
            }
        });
        
        // Click to lock
        document.addEventListener('click', (e) => {
            if (!config.enabled) return;
            
            const element = document.elementFromPoint(e.clientX, e.clientY);
            
            if (element && !isInspectorElement(element)) {
                e.preventDefault();
                e.stopPropagation();
                lockElement(element);
            }
        }, true);
    }
    
    // Check if element is part of inspector UI
    function isInspectorElement(element) {
        return element === panel || 
               element === overlay || 
               panel.contains(element) || 
               overlay.contains(element);
    }
    
    // Toggle inspector
    function toggleInspector() {
        config.enabled = !config.enabled;
        
        if (config.enabled) {
            panel.classList.add('active');
            overlay.style.display = 'block';
            document.body.style.cursor = 'crosshair';
        } else {
            panel.classList.remove('active');
            overlay.style.display = 'none';
            document.body.style.cursor = '';
            config.locked = false;
            currentElement = null;
            lockedElement = null;
            updateLockedIndicator();
        }
    }
    
    // Inspect element
    function inspectElement(element) {
        if (!element || element === currentElement) return;
        
        currentElement = element;
        highlightElement(element);
        displayElementInfo(element);
    }
    
    // Lock element
    function lockElement(element) {
        config.locked = true;
        lockedElement = element;
        inspectElement(element);
        updateLockedIndicator();
    }
    
    // Unlock element
    function unlockElement() {
        config.locked = false;
        lockedElement = null;
        updateLockedIndicator();
    }
    
    // Update locked indicator
    function updateLockedIndicator() {
        const indicator = panel.querySelector('.elementgrab-locked-indicator');
        indicator.style.display = config.locked ? 'inline-block' : 'none';
    }
    
    // Highlight element
    function highlightElement(element) {
        const rect = element.getBoundingClientRect();
        
        overlay.style.top = rect.top + window.scrollY + 'px';
        overlay.style.left = rect.left + window.scrollX + 'px';
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';
    }
    
    // Display element information
    function displayElementInfo(element) {
        const content = panel.querySelector('#elementgrab-content');
        
        const info = {
            tag: element.tagName.toLowerCase(),
            id: element.id || 'none',
            classes: element.className || 'none',
            attributes: getAttributes(element),
            dimensions: getDimensions(element),
            position: getPosition(element),
            styles: getComputedStyles(element),
            content: getElementContent(element),
            path: getElementPath(element),
            eventListeners: getEventListeners(element)
        };
        
        content.innerHTML = `
            <div class="elementgrab-section">
                <div class="elementgrab-section-title">Element</div>
                <div class="elementgrab-info-row">
                    <span class="elementgrab-label">Tag:</span>
                    <span class="elementgrab-value elementgrab-tag">&lt;${info.tag}&gt;</span>
                </div>
                <div class="elementgrab-info-row">
                    <span class="elementgrab-label">ID:</span>
                    <span class="elementgrab-value elementgrab-attribute">${escapeHtml(info.id)}</span>
                </div>
                <div class="elementgrab-info-row">
                    <span class="elementgrab-label">Classes:</span>
                    <span class="elementgrab-value elementgrab-string">${escapeHtml(info.classes)}</span>
                </div>
            </div>
            
            <div class="elementgrab-section">
                <div class="elementgrab-section-title">Dimensions & Position</div>
                <div class="elementgrab-style-grid">
                    <div class="elementgrab-info-row">
                        <span class="elementgrab-label">Width:</span>
                        <span class="elementgrab-value elementgrab-number">${info.dimensions.width}px</span>
                    </div>
                    <div class="elementgrab-info-row">
                        <span class="elementgrab-label">Height:</span>
                        <span class="elementgrab-value elementgrab-number">${info.dimensions.height}px</span>
                    </div>
                    <div class="elementgrab-info-row">
                        <span class="elementgrab-label">Top:</span>
                        <span class="elementgrab-value elementgrab-number">${info.position.top}px</span>
                    </div>
                    <div class="elementgrab-info-row">
                        <span class="elementgrab-label">Left:</span>
                        <span class="elementgrab-value elementgrab-number">${info.position.left}px</span>
                    </div>
                    <div class="elementgrab-info-row">
                        <span class="elementgrab-label">Right:</span>
                        <span class="elementgrab-value elementgrab-number">${info.position.right}px</span>
                    </div>
                    <div class="elementgrab-info-row">
                        <span class="elementgrab-label">Bottom:</span>
                        <span class="elementgrab-value elementgrab-number">${info.position.bottom}px</span>
                    </div>
                </div>
            </div>
            
            ${info.attributes.length > 0 ? `
            <div class="elementgrab-section">
                <div class="elementgrab-section-title">Attributes</div>
                ${info.attributes.map(attr => `
                    <div class="elementgrab-info-row">
                        <span class="elementgrab-label">${escapeHtml(attr.name)}:</span>
                        <span class="elementgrab-value elementgrab-string">${escapeHtml(attr.value)}</span>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            <div class="elementgrab-section">
                <div class="elementgrab-section-title">Key Computed Styles</div>
                <div class="elementgrab-style-grid">
                    ${Object.entries(info.styles).map(([key, value]) => `
                        <div class="elementgrab-info-row">
                            <span class="elementgrab-label">${key}:</span>
                            <span class="elementgrab-value">${escapeHtml(value)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="elementgrab-section">
                <div class="elementgrab-section-title">Content Preview</div>
                <div class="elementgrab-info-row">
                    <span class="elementgrab-value elementgrab-string" style="max-height: 100px; overflow-y: auto;">
                        ${escapeHtml(info.content)}
                    </span>
                </div>
            </div>
            
            <div class="elementgrab-section">
                <div class="elementgrab-section-title">DOM Path</div>
                <div class="elementgrab-info-row">
                    <span class="elementgrab-value elementgrab-tag" style="font-size: 11px;">
                        ${info.path}
                    </span>
                </div>
            </div>
            
            ${info.eventListeners.length > 0 ? `
            <div class="elementgrab-section">
                <div class="elementgrab-section-title">Event Listeners</div>
                ${info.eventListeners.map(event => `
                    <div class="elementgrab-info-row">
                        <span class="elementgrab-label">${event}:</span>
                        <span class="elementgrab-value elementgrab-attribute">attached</span>
                    </div>
                `).join('')}
            </div>
            ` : ''}
        `;
    }
    
    // Helper functions
    function getAttributes(element) {
        const attrs = [];
        for (let attr of element.attributes) {
            if (attr.name !== 'class' && attr.name !== 'id') {
                attrs.push({ name: attr.name, value: attr.value });
            }
        }
        return attrs;
    }
    
    function getDimensions(element) {
        const rect = element.getBoundingClientRect();
        return {
            width: Math.round(rect.width),
            height: Math.round(rect.height)
        };
    }
    
    function getPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            top: Math.round(rect.top + window.scrollY),
            left: Math.round(rect.left + window.scrollX),
            right: Math.round(rect.right + window.scrollX),
            bottom: Math.round(rect.bottom + window.scrollY)
        };
    }
    
    function getComputedStyles(element) {
        const computed = window.getComputedStyle(element);
        return {
            'display': computed.display,
            'position': computed.position,
            'z-index': computed.zIndex,
            'color': computed.color,
            'background': computed.backgroundColor,
            'font-size': computed.fontSize,
            'font-family': computed.fontFamily.split(',')[0],
            'margin': computed.margin,
            'padding': computed.padding,
            'border': computed.border || 'none',
            'opacity': computed.opacity,
            'overflow': computed.overflow
        };
    }
    
    function getElementContent(element) {
        let content = element.textContent || element.innerText || '';
        content = content.trim();
        
        if (content.length > 200) {
            content = content.substring(0, 200) + '...';
        }
        
        if (!content && element.tagName === 'IMG') {
            content = `[Image: ${element.src}]`;
        } else if (!content && element.tagName === 'CANVAS') {
            content = `[Canvas: ${element.width}x${element.height}]`;
        } else if (!content) {
            content = '[Empty element]';
        }
        
        return content;
    }
    
    function getElementPath(element) {
        const path = [];
        let current = element;
        
        while (current && current !== document.body) {
            let selector = current.tagName.toLowerCase();
            
            if (current.id) {
                selector += '#' + current.id;
            } else if (current.className) {
                const classes = current.className.toString().trim().split(/\s+/);
                if (classes.length > 0 && classes[0]) {
                    selector += '.' + classes[0];
                }
            }
            
            path.unshift(selector);
            current = current.parentElement;
        }
        
        return path.join(' > ');
    }
    
    function getEventListeners(element) {
        // Note: This is limited as we can't directly access all event listeners
        // We'll check for common event attributes
        const events = [];
        const eventProps = ['onclick', 'onmouseover', 'onmouseout', 'onmousedown', 
                          'onmouseup', 'onkeydown', 'onkeyup', 'onchange', 'onsubmit'];
        
        for (let prop of eventProps) {
            if (element[prop]) {
                events.push(prop.substring(2));
            }
        }
        
        return events;
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Expose API
    window.ElementGrab = {
        toggle: toggleInspector,
        enable: () => { if (!config.enabled) toggleInspector(); },
        disable: () => { if (config.enabled) toggleInspector(); },
        isEnabled: () => config.enabled,
        version: '1.0.0'
    };
    
})();


