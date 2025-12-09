// ============================================================
// AUDIO SYSTEM (HTML5 Audio Pools)
// ============================================================

const AUDIO_CONFIG = {
    bump: { src: 'sounds/bump1.mp3', poolSize: 6 },
    shoosh: { src: 'sounds/shoosh1.mp3', poolSize: 4 },
    woah: { src: 'music/woah.mp3', poolSize: 2},
    office: { src: 'sounds/office.mp3', poolSize: 1 },
    shortmeow: { src: 'sounds/shortmeow.mp3', poolSize: 2 },
    sortLong: { src: 'sounds/sortLong.mp3', poolSize: 1 },
    combo_1: { src: 'sounds/combo_1.mp3', poolSize: 2 },
    combo_2: { src: 'sounds/combo_2.mp3', poolSize: 2 },
    combo_3: { src: 'sounds/combo_3.mp3', poolSize: 2 },
    combo_4: { src: 'sounds/combo_4.mp3', poolSize: 2 },
    combo_5: { src: 'sounds/combo_5.mp3', poolSize: 2 },
    bronze_medal: { src: 'sounds/medals/Bronze_Medal.mp3', poolSize: 1 },
    silver_medal: { src: 'sounds/medals/Silver_Medal.mp3', poolSize: 1 },
    gold_medal: { src: 'sounds/medals/Gold_Medal.mp3', poolSize: 1 },
    platinum_medal: { src: 'sounds/medals/PlatinumMedal.mp3', poolSize: 1 }
};

const audioPools = new Map();
let audioInitialized = false;

function canPlayAudioType(type) {
    const tester = new Audio();
    return tester.canPlayType(type);
}

function createAudioInstance(src) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audio.setAttribute('playsinline', '');
    return audio;
}

function initAudio() {
    if (audioInitialized) return;

    Object.entries(AUDIO_CONFIG).forEach(([name, config]) => {
        const poolSize = config.poolSize || 4;
        const instances = [];

        for (let i = 0; i < poolSize; i++) {
            instances.push(createAudioInstance(config.src));
        }

        audioPools.set(name, {
            instances,
            src: config.src
        });
    });

    audioInitialized = true;
}

function getAudioFromPool(name) {
    const pool = audioPools.get(name);
    if (!pool) return null;

    for (let i = 0; i < pool.instances.length; i++) {
        const audio = pool.instances[i];
        if (audio.paused || audio.ended) {
            return audio;
        }
    }

    // All instances are busy – add a new one on demand
    const fallback = createAudioInstance(pool.src);
    pool.instances.push(fallback);
    return fallback;
}

function playSound(name, { volume = 0.5, playbackRate = 1 } = {}) {
    if (!audioInitialized) {
        initAudio();
    }

    const audio = getAudioFromPool(name);
    if (!audio) return null;

    try {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = volume;
        audio.playbackRate = playbackRate;
        audio.play();
        return audio; // Return the audio element so we can control it
    } catch (error) {
        // Ignore playback promise rejections (user gesture requirements, etc.)
        return null;
    }
}

// Preload a specific audio file and return a promise
function preloadAudio(name) {
    return new Promise((resolve, reject) => {
        if (!audioInitialized) {
            initAudio();
        }

        const pool = audioPools.get(name);
        if (!pool) {
            reject(new Error(`Audio "${name}" not found in config`));
            return;
        }

        const audio = pool.instances[0];
        
        // If already loaded
        if (audio.readyState >= 3) {
            resolve(audio);
            return;
        }

        // Wait for it to load
        audio.addEventListener('canplaythrough', function onLoaded() {
            audio.removeEventListener('canplaythrough', onLoaded);
            resolve(audio);
        });

        audio.addEventListener('error', function onError() {
            audio.removeEventListener('error', onError);
            reject(new Error(`Failed to load audio: ${name}`));
        });

        // Trigger loading
        audio.load();
    });
}

// Fade out audio over a duration (ms)
function fadeOutAudio(audioElement, duration = 800) {
    if (!audioElement) return;
    
    const startVolume = audioElement.volume;
    const startTime = Date.now();
    
    function fade() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        audioElement.volume = startVolume * (1 - progress);
        
        if (progress < 1) {
            requestAnimationFrame(fade);
        } else {
            audioElement.pause();
            audioElement.currentTime = 0;
            audioElement.volume = startVolume; // Reset volume for next use
        }
    }
    
    fade();
}

// Initialize immediately so assets are ready once the user interacts with the page
initAudio();

// Expose globally for the rest of the game
window.playSound = playSound;
window.preloadAudio = preloadAudio;
window.fadeOutAudio = fadeOutAudio;
