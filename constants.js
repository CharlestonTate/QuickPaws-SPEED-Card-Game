// ============================================================
// CONSTANTS & CANVAS SETUP
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Card dimensions
const CARD_WIDTH = 120;
const CARD_HEIGHT = 180;
const CARD_RADIUS = 12;
const CENTER_CARD_WIDTH = 160;
const CENTER_CARD_HEIGHT = 240;

// Game state variables
let gameState = 'initial'; // 'initial', 'splash', 'mainmenu', 'credits', 'playing', 'gameover'
let userInteracted = false; // Track if user has interacted (for audio context)
// let gameState = 'initial'; // 'initial', 'mainmenu', 'settings', 'playing', 'gameover' (COMMENTED OUT - settings removed)
let mouseX = 0;
let mouseY = 0;
let draggedCard = null;
let dragOffset = { x: 0, y: 0 };
let draggedCardOriginalPos = null; // Store original position for smooth return
let isCardReturning = false; // Flag to indicate card is animating back
let isCardPlopping = false; // Flag to indicate card is plopping onto pile
let reorderInsertIndex = null; // Index where card will be inserted when reordering
let isReordering = false; // Flag to indicate we're reordering, not playing
let isDraggingSlider = false; // Flag for dragging settings sliders
let activeSliderKey = null; // Which setting slider is being dragged

// UI Button definitions
const startButton = {
    x: canvas.width / 2 - 100,
    y: canvas.height / 2 + 50,
    width: 200,
    height: 60
};

const newGameButton = {
    x: 20,
    y: canvas.height - 70,
    width: 150,
    height: 50
};

