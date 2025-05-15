// Configuration Variables
const CONFIG = {
    chipWidth: 100, // Base width of chips
    chipHeight: 50, // Base height of chips
    chipScale: 2.4, // Initial chip scale
    chipMargin: 7, // Margin around valid chip positions
    bgScale: 0.9, // Initial background scale
    bgOpacity: 1.0, // Initial background opacity
    highlightColor: '#FF2200', // Highlight border for selected chip
    highlightBorderWidth: 2, // Border width of rectangle
    debugValidAreaColor: 'rgba(0, 255, 0, 0.5)', // Green with transparency for debug
    showDebugOutput: false, // Debug flag to show valid chip areas
    canvasWidth: 1675,
    canvasHeight: 986,
    maxPlacementAttempts: 100, // Maximum attempts to place a chip without overlap
    startWidhCorrectPosition: true, // if true positions the memory chips correctly on load
    timerFontStyle: {
        fontFamily: 'Arial',
        fillStyle: '#66ff66', // Light green fill
        strokeStyle: '#023020', // Dark green border
        lineWidth: 5 // Border width
    },
    timerMarginTop: 30, // Margin from top edge (in pixels)
    timerMarginRight: 310 // Margin from right edge (in pixels)
};

const canvas = document.getElementById('chipCanvas');
const ctx = canvas.getContext('2d');

// Chip designations
const chipNames = [
    'U1_R0C0', 'U1_R0C2', 'U1_R1C0', 'U1_R1C2',
    'U2_R0C0', 'U2_R0C2', 'U2_R1C0', 'U2_R1C2',
    'U3_R0C0', 'U3_R0C2', 'U3_R1C0', 'U3_R1C2',
    'U4_R0C0', 'U4_R0C2', 'U4_R1C0', 'U4_R1C2'
];

// Valid chip positions and orientations (current positions are correct)
const validChips = [
    { name: 'U1_R0C0', x: 187, y: 165, rotation: 0 },
    { name: 'U1_R0C2', x: -24, y: 345, rotation: 90 },
    { name: 'U1_R1C0', x: 187, y: 548, rotation: 0 },
    { name: 'U1_R1C2', x: 396, y: 346, rotation: 90 },
    { name: 'U2_R0C0', x: -24, y: 745, rotation: 90 },
    { name: 'U2_R0C2', x: 401, y: 746, rotation: 90 },
    { name: 'U2_R1C0', x: 577, y: 747, rotation: 90 },
    { name: 'U2_R1C2', x: 790, y: 626, rotation: 90 },
    { name: 'U3_R0C0', x: 578, y: 347, rotation: 90 },
    { name: 'U3_R0C2', x: 1003, y: 345, rotation: 90 },
    { name: 'U3_R1C0', x: 1403, y: 289, rotation: 0 },
    { name: 'U3_R1C2', x: 1184, y: 346, rotation: 90 },
    { name: 'U4_R0C0', x: 1003, y: 747, rotation: 90 },
    { name: 'U4_R0C2', x: 1184, y: 746, rotation: 90 },
    { name: 'U4_R1C0', x: 1404, y: 805, rotation: 0 },
    { name: 'U4_R1C2', x: 1404, y: 548, rotation: 0 }
];

// Chip objects: position, rotation, and dragging state (start with correct positions)
let chips = [];
if (CONFIG.startWidhCorrectPosition) {
    validChips.forEach(validChip => {
        chips.push({
            name: validChip.name,
            x: validChip.x,
            y: validChip.y,
            rotation: validChip.rotation,
            isDragging: false
        });
    });
}

const scaledWidth = CONFIG.chipWidth * CONFIG.chipScale;
const scaledHeight = CONFIG.chipHeight * CONFIG.chipScale;

// Function to randomly place chips without overlaps
function placeChipsRandomly() {
    chips = [];
    validChips.forEach(validChip => {
        // Change orientation randomly
        const orientations = [0, 90, 180, 270];
        const randomRotation = orientations[Math.floor(Math.random() * orientations.length)];

        let placed = false;
        let attempts = 0;
        let chipX, chipY;
        let width = scaledWidth;
        let height = scaledHeight;
        // Use the random rotation to determine dimensions for overlap checking
        if (randomRotation === 90 || randomRotation === 270) {
            [width, height] = [height, width];
        }

        while (!placed && attempts < CONFIG.maxPlacementAttempts) {
            const maxX = CONFIG.canvasWidth - width;
            const maxY = CONFIG.canvasHeight - height;
            chipX = Math.random() * maxX;
            chipY = Math.random() * maxY;

            // Check for overlap with already placed chips
            const newBounds = {
                left: chipX,
                right: chipX + width,
                top: chipY,
                bottom: chipY + height
            };
            const overlaps = chips.some(existingChip => {
                let existingWidth = scaledWidth;
                let existingHeight = scaledHeight;
                if (existingChip.rotation === 90 || existingChip.rotation === 270) {
                    [existingWidth, existingHeight] = [existingHeight, existingWidth];
                }
                const existingBounds = {
                    left: existingChip.x,
                    right: existingChip.x + existingWidth,
                    top: existingChip.y,
                    bottom: existingChip.y + existingHeight
                };
                return !(newBounds.right <= existingBounds.left ||
                         newBounds.left >= existingBounds.right ||
                         newBounds.bottom <= existingBounds.top ||
                         newBounds.top >= existingBounds.bottom);
            });

            if (!overlaps) {
                chips.push({
                    name: validChip.name,
                    x: chipX,
                    y: chipY,
                    rotation: randomRotation, // Use the random rotation
                    isDragging: false
                });
                placed = true;
            }
            attempts++;
        }

        if (!placed) {
            console.warn(`Could not place chip ${validChip.name} without overlap after ${attempts} attempts.`);
            chips.push({
                name: validChip.name,
                x: chipX,
                y: chipY,
                rotation: randomRotation, // Use the random rotation
                isDragging: false
            });
        }
    });
}

// Initial chip placement
if (CONFIG.startWidhCorrectPosition === false) {
    placeChipsRandomly();
}

// Load the background image (from images.js)
const bgImage = new Image();
bgImage.src = backgroundImage; // Defined in images.js
let bgImageLoaded = false;
bgImage.onload = () => {
    bgImageLoaded = true;
    draw();
};
bgImage.onerror = () => {
    console.warn('Failed to load background image. Check backgroundImage in images.js');
};

// Load the default chip image (from images.js)
const chipImage = new Image();
chipImage.src = grayChip; // Defined in images.js
let chipImageLoaded = false;
chipImage.onload = () => {
    chipImageLoaded = true;
    draw();
};
chipImage.onerror = () => {
    console.warn('Failed to load default chip image. Check grayChip in images.js');
};

// Load the selected chip image (from images.js)
const chipImageSelected = new Image();
chipImageSelected.src = purpleChip; // Defined in images.js
let chipImageSelectedLoaded = false;
chipImageSelected.onload = () => {
    chipImageSelectedLoaded = true;
    draw();
};
chipImageSelected.onerror = () => {
    console.warn('Failed to load selected chip image. Check purpleChip in images.js');
};

// Load the correct chip image (from images.js)
const chipImageCorrect = new Image();
chipImageCorrect.src = greenChip; // Defined in images.js
let chipImageCorrectLoaded = false;
chipImageCorrect.onload = () => {
    chipImageCorrectLoaded = true;
    draw();
};
chipImageCorrect.onerror = () => {
    console.warn('Failed to load correct chip image. Check greenChip in images.js');
};

// Load the incorrect chip image (from images.js)
const chipImageIncorrect = new Image();
chipImageIncorrect.src = redChip; // Defined in images.js
let chipImageIncorrectLoaded = false;
chipImageIncorrect.onload = () => {
    chipImageIncorrectLoaded = true;
    draw();
};
chipImageIncorrect.onerror = () => {
    console.warn('Failed to load incorrect chip image. Check redChip in images.js');
};

// RAS and CAS states
let ras0 = false;
let ras1 = false;
let cas0 = false;
let cas2 = false;
let isTurnOnPressed = false; // Track Turn ON button state

// Track the last selected chip for rotation and highlighting
let lastSelectedChip = null;

// Global AudioContext (created once)
let audioCtx = null;
let isPlaying = false; // Flag to track if a tune is currently playing
let isRotating = false; // Track if a rotation is in progress
let showInstruction = true; // Flag to show instruction text
let timerStart = null; // Timestamp when timer starts
let timerRunning = false; // Flag to track if timer is active
let timerElapsed = 0; // Elapsed time in seconds (for when stopped)
let timerInterval = null; // Interval ID for timer redraw

// Initialize or resume AudioContext on first interaction
function initializeAudioContext() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
        if (CONFIG.showDebugOutput) {
            console.log('AudioContext created, state:', audioCtx.state);
        }
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            if (CONFIG.showDebugOutput) {
                console.log('AudioContext resumed, state:', audioCtx.state);
            }
        }).catch(err => {
            console.error('Failed to resume AudioContext:', err);
        });
    }
}

// Initialize or resume AudioContext on first interaction
function initializeAudioContext() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
        if (CONFIG.showDebugOutput) {
            console.log('AudioContext created, state:', audioCtx.state);
        }
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            if (CONFIG.showDebugOutput) {
                console.log('AudioContext resumed, state:', audioCtx.state);
            }
        }).catch(err => {
            console.error('Failed to resume AudioContext:', err);
        });
    }
}

// Enhanced playBeep function to play single or sequential notes, one tune at a time
function playBeep(options) {
    // Ignore new requests if a tune is already playing
    if (isPlaying) {
        if (CONFIG.showDebugOutput) {
            console.log('Tune is already playing, ignoring new request:', options);
        }
        return;
    }

    if (CONFIG.showDebugOutput) {
        console.log('playBeep called with options:', options);
    }
    if (!audioCtx) {
        initializeAudioContext();
    }

    isPlaying = true; // Set the flag to indicate a tune is playing

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(options.volume || 0.1, audioCtx.currentTime);
    gain.connect(audioCtx.destination);

    // Calculate the total duration of the tune
    let totalDuration = 0;

    if (Array.isArray(options.notes)) {
        // Play a sequence of notes (e.g., for happy tune)
        let currentTime = audioCtx.currentTime;
        if (CONFIG.showDebugOutput) {
            console.log('Playing happy tune sequence at time:', currentTime);
        }
        options.notes.forEach((note, index) => {
            const oscillator = audioCtx.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(note.hz, currentTime);
            oscillator.connect(gain);
            oscillator.start(currentTime);
            oscillator.stop(currentTime + (note.duration || 0.2));
            if (CONFIG.showDebugOutput) {
                console.log(`Note ${index}: Hz=${note.hz}, Start=${currentTime}, Duration=${note.duration || 0.2}`);
            }
            currentTime += (note.duration || 0.2) + 0.05; // Small gap between notes
        });
        // Calculate total duration for sequential notes (including gaps)
        totalDuration = options.notes.reduce((sum, note) => sum + (note.duration || 0.2) + 0.05, 0);
    } else {
        // Play a single note or repeated beeps
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(options.hz, audioCtx.currentTime);
        oscillator.connect(gain);

        if (options.repeat) {
            if (CONFIG.showDebugOutput) {
                console.log('Playing "beep beep" at Hz:', options.hz);
            }
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.5);
            const oscillator2 = audioCtx.createOscillator();
            oscillator2.type = 'sine';
            oscillator2.frequency.setValueAtTime(options.hz, audioCtx.currentTime + 0.6);
            oscillator2.connect(gain);
            oscillator2.start(audioCtx.currentTime + 0.6);
            oscillator2.stop(audioCtx.currentTime + 1.0);
            if (CONFIG.showDebugOutput) {
                console.log('Beep 1: Start=', audioCtx.currentTime, 'End=', audioCtx.currentTime + 0.5);
                console.log('Beep 2: Start=', audioCtx.currentTime + 0.6, 'End=', audioCtx.currentTime + 1.0);
            }
            totalDuration = 1.0; // Total duration for "beep beep" (end of second beep)
        } else {
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + (options.duration || 0.05));
            if (CONFIG.showDebugOutput) {
                console.log('Single beep: Hz=', options.hz, 'Duration=', options.duration || 0.05);
            }
            totalDuration = options.duration || 0.05;
        }
    }

    // Reset the isPlaying flag after the tune finishes
    setTimeout(() => {
        isPlaying = false;
        if (CONFIG.showDebugOutput) {
            console.log('Tune finished, ready for next request');
        }
    }, totalDuration * 1000); // Convert seconds to milliseconds
}

// Play a swoosh sound for chip rotation
function playSwoosh() {
    if (isPlaying) {
        if (CONFIG.showDebugOutput) {
            console.log('Swoosh is already playing, ignoring new request');
        }
        return;
    }

    if (!audioCtx) {
        initializeAudioContext();
    }

    isPlaying = true;

    // Create a white noise source for the airy swoosh texture
    const bufferSize = audioCtx.sampleRate * 0.12; // 0.12s duration for slightly slower sound
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = Math.random() * 2 - 1; // White noise
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;

    // Create a sine oscillator for the frequency glide
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, audioCtx.currentTime); // Start at 200Hz for deeper sound
    oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1); // Glide to 50Hz

    // Gain nodes for noise and oscillator
    const noiseGain = audioCtx.createGain();
    const oscGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.03, audioCtx.currentTime); // Keep noise volume
    oscGain.gain.setValueAtTime(0.02, audioCtx.currentTime); // Keep oscillator volume

    // Apply envelope to both sources
    const envelope = audioCtx.createGain();
    envelope.gain.setValueAtTime(0, audioCtx.currentTime);
    envelope.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.01); // Fast attack
    envelope.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12); // Decay over 0.12s

    // Connect nodes
    noise.connect(noiseGain).connect(envelope);
    oscillator.connect(oscGain).connect(envelope);
    envelope.connect(audioCtx.destination);

    // Start and stop
    noise.start(audioCtx.currentTime);
    oscillator.start(audioCtx.currentTime);
    noise.stop(audioCtx.currentTime + 0.12);
    oscillator.stop(audioCtx.currentTime + 0.12);

    // Reset isPlaying after sound finishes
    setTimeout(() => {
        isPlaying = false;
        if (CONFIG.showDebugOutput) {
            console.log('Swoosh finished');
        }
    }, 120); // 120ms matches duration
}

function playClick() {
    if (isPlaying) {
        if (CONFIG.showDebugOutput) {
            console.log('Click-clack sound is already playing, ignoring new request');
        }
        return;
    }

    if (!audioCtx) {
        initializeAudioContext();
    }

    isPlaying = true;

    // First sound: High-pitched "click"
    const clickDuration = 0.03; // 10ms for sharp click
    const clickBufferSize = audioCtx.sampleRate * clickDuration;
    const clickNoiseBuffer = audioCtx.createBuffer(1, clickBufferSize, audioCtx.sampleRate);
    const clickNoiseData = clickNoiseBuffer.getChannelData(0);
    for (let i = 0; i < clickBufferSize; i++) {
        clickNoiseData[i] = Math.random() * 2 - 1; // White noise
    }
    const clickNoise = audioCtx.createBufferSource();
    clickNoise.buffer = clickNoiseBuffer;

    // High-pass filter for click to make it brighter
    const clickFilter = audioCtx.createBiquadFilter();
    clickFilter.type = 'highpass';
    clickFilter.frequency.setValueAtTime(400, audioCtx.currentTime); // High frequencies

    // Gain for click
    const clickGain = audioCtx.createGain();
    clickGain.gain.setValueAtTime(0.12, audioCtx.currentTime); // Slightly louder
    clickGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + clickDuration);

    // Second sound: Lower-pitched "clack"
    const clackDuration = 0.015; // 15ms for heavier clack
    const clackBufferSize = audioCtx.sampleRate * clackDuration;
    const clackNoiseBuffer = audioCtx.createBuffer(1, clackBufferSize, audioCtx.sampleRate);
    const clackNoiseData = clackNoiseBuffer.getChannelData(0);
    for (let i = 0; i < clackBufferSize; i++) {
        clackNoiseData[i] = Math.random() * 2 - 1; // White noise
    }
    const clackNoise = audioCtx.createBufferSource();
    clackNoise.buffer = clackNoiseBuffer;

    // Low-pass filter for clack to make it deeper
    const clackFilter = audioCtx.createBiquadFilter();
    clackFilter.type = 'lowpass';
    clackFilter.frequency.setValueAtTime(100, audioCtx.currentTime); // Lower frequencies

    // Gain for clack
    const clackGain = audioCtx.createGain();
    clackGain.gain.setValueAtTime(0.1, audioCtx.currentTime); // Moderate volume
    clackGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + clackDuration);

    // Connect nodes
    clickNoise.connect(clickFilter).connect(clickGain).connect(audioCtx.destination);
    clackNoise.connect(clackFilter).connect(clackGain).connect(audioCtx.destination);

    // Start and stop with 5ms gap between click and clack
    clickNoise.start(audioCtx.currentTime);
    clickNoise.stop(audioCtx.currentTime + clickDuration);
    clackNoise.start(audioCtx.currentTime + clickDuration + 0.005); // 5ms gap
    clackNoise.stop(audioCtx.currentTime + clickDuration + 0.005 + clackDuration);

    // Reset isPlaying after sound finishes
    const totalDuration = clickDuration + 0.005 + clackDuration; // ~30ms
    setTimeout(() => {
        isPlaying = false;
        if (CONFIG.showDebugOutput) {
            console.log('Click-clack sound finished');
        }
    }, totalDuration * 1000); // Convert to ms
}

function formatTime(seconds) {
    if (seconds >= 3600) { // Cap at 59:59 (3600 seconds)
        return '59:59';
    }
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startTimerInterval() {
    if (!timerInterval) {
        timerInterval = setInterval(() => {
            if (timerRunning) {
                draw(); // Redraw canvas every second
            }
        }, 1000);
    }
}

function stopTimerInterval() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Toggle RAS buttons
function toggleRAS(buttonId) {
    if (buttonId === 'ras0') {
        ras0 = !ras0;
        if (ras0) ras1 = false; // Ensure RAS1 is off if RAS0 is on
    } else if (buttonId === 'ras1') {
        ras1 = !ras1;
        if (ras1) ras0 = false; // Ensure RAS0 is off if RAS1 is on
    }
    updateButtonState('ras0', ras0);
    updateButtonState('ras1', ras1);
    draw();
}

// Toggle CAS buttons
function toggleCAS(buttonId) {
    if (buttonId === 'cas0') {
        cas0 = !cas0;
        if (cas0) cas2 = false; // Ensure CAS2 is off if CAS0 is on
    } else if (buttonId === 'cas2') {
        cas2 = !cas2;
        if (cas2) cas0 = false; // Ensure CAS0 is off if CAS2 is on
    }
    updateButtonState('cas0', cas0);
    updateButtonState('cas2', cas2);
    draw();
}

// Update button appearance
function updateButtonState(buttonId, state) {
    const button = document.getElementById(buttonId);
    //button.textContent = state ? 'On' : 'Off';
    button.className = state ? 'toggle-on' : 'toggle-off';
}

// Determine if a chip is selected based on RAS and CAS states
function isChipSelected(chipName) {
    const [, rasIndex, casIndex] = chipName.split(/[R,C]/);
    const chipRas = `R${rasIndex}`;
    const chipCas = `C${casIndex}`;
    const rasMatch = (ras0 && chipRas === 'R0') || (ras1 && chipRas === 'R1');
    const casMatch = (cas0 && chipCas === 'C0') || (cas2 && chipCas === 'C2');
    const rasActive = ras0 || ras1;
    const casActive = cas0 || cas2;
    return rasActive && casActive && rasMatch && casMatch;
}

// Get the bounding box of a chip after rotation
function getRotatedChipBounds(chip) {
    const scaledWidth = CONFIG.chipWidth * CONFIG.chipScale;
    const scaledHeight = CONFIG.chipHeight * CONFIG.chipScale;
    let width = scaledWidth;
    let height = scaledHeight;
    if (chip.rotation === 90 || chip.rotation === 270) {
        [width, height] = [height, width];
    }

    // The chip is rotated around its center, so adjust the top-left corner
    const centerX = chip.x + scaledWidth / 2;
    const centerY = chip.y + scaledHeight / 2;
    let adjustedX = chip.x;
    let adjustedY = chip.y;

    if (chip.rotation === 90 || chip.rotation === 270) {
        adjustedX = centerX - width / 2;
        adjustedY = centerY - height / 2;
    }

    return {
        left: adjustedX,
        right: adjustedX + width,
        top: adjustedY,
        bottom: adjustedY + height
    };
}

// Validate chip configuration
function validateChipConfiguration() {
    const chipStates = chips.map(chip => {
        const validChip = validChips.find(vc => vc.name === chip.name);
        let isCorrect = true;

        // Check orientation
        if (chip.rotation !== validChip.rotation) {
            isCorrect = false;
        }

        // Check position within valid area
        const chipBounds = getRotatedChipBounds(chip);
        const validBounds = getRotatedChipBounds(validChip);
        const adjustedValidBounds = {
            left: validBounds.left - CONFIG.chipMargin,
            right: validBounds.right + CONFIG.chipMargin,
            top: validBounds.top - CONFIG.chipMargin,
            bottom: validBounds.bottom + CONFIG.chipMargin
        };

        // Log bounds for debugging if debug flag is enabled
        if (CONFIG.showDebugOutput) {
            console.log(`${chip.name} Chip Bounds:`, chipBounds);
            console.log(`${chip.name} Valid Bounds:`, adjustedValidBounds);
        }

        if (chipBounds.left < adjustedValidBounds.left ||
            chipBounds.right > adjustedValidBounds.right ||
            chipBounds.top < adjustedValidBounds.top ||
            chipBounds.bottom > adjustedValidBounds.bottom) {
            isCorrect = false;
        }

        // Check for overlaps
        for (const otherChip of chips) {
            if (otherChip.name === chip.name) continue;
            const otherBounds = getRotatedChipBounds(otherChip);
            const noOverlap = chipBounds.right <= otherBounds.left ||
                              chipBounds.left >= otherBounds.right ||
                              chipBounds.bottom <= otherBounds.top ||
                              chipBounds.top >= otherBounds.bottom;
            if (!noOverlap) {
                isCorrect = false;
                break;
            }
        }

        return { name: chip.name, isCorrect };
    });
    return chipStates;
}

// Rotate a chip by 90 degrees with animation
function rotateChip(chipName) {
    if (isRotating) {
        if (CONFIG.showDebugOutput) {
            console.log('Rotation in progress, ignoring new request for:', chipName);
        }
        return;
    }

    const chip = chips.find(c => c.name === chipName);
    if (chip) {
        isRotating = true; // Set flag to block new rotations
        const startRotation = chip.rotation;
        let targetRotation = (chip.rotation + 90) % 360;
        // Special case: for 270 to 0, rotate forward to 360 (visually same as 0)
        if (startRotation === 270 && targetRotation === 0) {
            targetRotation = 360;
        }
        const animationDuration = 120; // 120ms to match swoosh sound
        const startTime = performance.now();

        // Play swoosh sound
        playSwoosh();

        // Animation loop
        function animateRotation(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / animationDuration, 1); // 0 to 1
            // Linear interpolation for smooth rotation
            chip.rotation = startRotation + (targetRotation - startRotation) * progress;

            // Redraw canvas
            draw();

            // Continue animation if not complete
            if (progress < 1) {
                requestAnimationFrame(animateRotation);
            } else {
                // Ensure final rotation is exact (reset to 0 if target is 360)
                chip.rotation = targetRotation === 360 ? 0 : targetRotation;
                isRotating = false; // Clear flag when animation completes
                draw();
            }
        }

        // Start animation
        requestAnimationFrame(animateRotation);
    }
}

// Add this helper function after rotateChip function
function isChipInValidRegion(chip) {
    const chipBounds = getRotatedChipBounds(chip);

    // Check all valid chip regions
    for (const validChip of validChips) {
        const validBounds = getRotatedChipBounds(validChip);
        // Use the same bounds as the green debug border (CONFIG.chipMargin = 7)
        const adjustedValidBounds = {
            left: validBounds.left - CONFIG.chipMargin,
            right: validBounds.right + CONFIG.chipMargin,
            top: validBounds.top - CONFIG.chipMargin,
            bottom: validBounds.bottom + CONFIG.chipMargin
        };

        // Check if chip is fully contained within the adjusted valid bounds
        const isFullyContained =
            chipBounds.left >= adjustedValidBounds.left &&
            chipBounds.right <= adjustedValidBounds.right &&
            chipBounds.top >= adjustedValidBounds.top &&
            chipBounds.bottom <= adjustedValidBounds.bottom;

        if (isFullyContained) {
            return validChip; // Return the valid chip for snapping
        }
    }
    return null; // No valid region found
}

// Resolve: Place all chips in their correct positions
function resolveGame() {
    chips.forEach(chip => {
        const validChip = validChips.find(vc => vc.name === chip.name);
        chip.x = validChip.x;
        chip.y = validChip.y;
        chip.rotation = validChip.rotation;
        chip.isDragging = false;
    });
    lastSelectedChip = null; // Clear selection
    // Remove timer
    timerRunning = false;
    timerElapsed = 0;
    stopTimerInterval(); // Stop redraw interval
    draw();
}

// Restart: Start a new game with randomly placed chips
function restartGame() {
    placeChipsRandomly();
    lastSelectedChip = null; // Clear selection
    ras0 = false;
    ras1 = false;
    cas0 = false;
    cas2 = false;
    updateButtonState('ras0', ras0);
    updateButtonState('ras1', ras1);
    updateButtonState('cas0', cas0);
    updateButtonState('cas2', cas2);
    // Start timer
    timerStart = performance.now();
    timerRunning = true;
    timerElapsed = 0;
    startTimerInterval(); // Start redraw interval
    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image with opacity
    if (bgImageLoaded) {
        ctx.save();
        ctx.globalAlpha = CONFIG.bgOpacity;
        const scaledBgWidth = bgImage.width * CONFIG.bgScale;
        const scaledBgHeight = bgImage.height * CONFIG.bgScale;
        ctx.drawImage(bgImage, 0, 0, scaledBgWidth, scaledBgHeight);
        ctx.restore();
    }

    // Draw valid chip areas if debug flag is enabled
    if (CONFIG.showDebugOutput) {
        validChips.forEach(validChip => {
            const bounds = getRotatedChipBounds(validChip);
            ctx.save();
            ctx.strokeStyle = CONFIG.debugValidAreaColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(
                bounds.left - CONFIG.chipMargin,
                bounds.top - CONFIG.chipMargin,
                (bounds.right - bounds.left) + 2 * CONFIG.chipMargin,
                (bounds.bottom - bounds.top) + 2 * CONFIG.chipMargin
            );
            ctx.restore();
        });
    }

    // Validate chips if Turn ON is pressed
    let chipStates = chips.map(chip => ({ name: chip.name, isCorrect: true }));
    if (isTurnOnPressed) {
        chipStates = validateChipConfiguration();
    }

    // Draw chips
    chips.forEach(chip => {
        ctx.save();
        const scaledWidth = CONFIG.chipWidth * CONFIG.chipScale;
        const scaledHeight = CONFIG.chipHeight * CONFIG.chipScale;
        ctx.translate(chip.x + scaledWidth / 2, chip.y + scaledHeight / 2);
        ctx.rotate((chip.rotation * Math.PI) / 180);
        ctx.translate(-scaledWidth / 2, -scaledHeight / 2);

        // Determine which image to use
        let imageToUse = chipImage;
        let imageLoaded = chipImageLoaded;
        if (isTurnOnPressed) {
            const chipState = chipStates.find(cs => cs.name === chip.name);
            if (chipState.isCorrect) {
                imageToUse = chipImageCorrect;
                imageLoaded = chipImageCorrectLoaded;
            } else {
                imageToUse = chipImageIncorrect;
                imageLoaded = chipImageIncorrectLoaded;
            }
        } else if (isChipSelected(chip.name)) {
            imageToUse = chipImageSelected;
            imageLoaded = chipImageSelectedLoaded;
        }

        // Draw chip (image or placeholder)
        if (imageLoaded) {
            ctx.drawImage(imageToUse, 0, 0, scaledWidth, scaledHeight);
        } else {
            ctx.fillStyle = '#555';
            ctx.fillRect(0, 0, scaledWidth, scaledHeight);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(0, 0, scaledWidth, scaledHeight);
        }

        // Draw yellow highlight if this chip is the last selected chip
        if (lastSelectedChip && chip.name === lastSelectedChip.name) {
            ctx.strokeStyle = CONFIG.highlightColor;
            ctx.lineWidth = CONFIG.highlightBorderWidth;
            ctx.strokeRect(0, 0, scaledWidth, scaledHeight);
        }

        // Draw chip name
        ctx.fillStyle = '#fff';
        ctx.font = `${12 * CONFIG.chipScale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(chip.name, scaledWidth / 2, scaledHeight / 2);

        ctx.restore();
    });

    // Draw instruction text if flag is true
    if (showInstruction) {
        ctx.save();
        ctx.fillStyle = '#66ff66';
        ctx.strokeStyle = '#023020';
        ctx.lineWidth = 5;
        ctx.font = '70px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const text = 'Rotate chips by pressing \'R\' on your keyboard';
        ctx.strokeText(text, CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2);
        ctx.fillText(text, CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2);
        ctx.restore();
    }

    // Draw timer if running or stopped with elapsed time
    if (timerRunning || timerElapsed > 0) {
        ctx.save();
        ctx.fillStyle = CONFIG.timerFontStyle.fillStyle; // Light green
        ctx.strokeStyle = CONFIG.timerFontStyle.strokeStyle; // Dark green
        ctx.lineWidth = CONFIG.timerFontStyle.lineWidth; // 5px border
        ctx.font = `50px ${CONFIG.timerFontStyle.fontFamily}`; // 50px Arial
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        const time = timerRunning
            ? formatTime(Math.min(3599, (performance.now() - timerStart) / 1000))
            : formatTime(timerElapsed);
        ctx.strokeText(time, CONFIG.canvasWidth - CONFIG.timerMarginRight, CONFIG.timerMarginTop); // Use separate margins
        ctx.fillText(time, CONFIG.canvasWidth - CONFIG.timerMarginRight, CONFIG.timerMarginTop);
        ctx.restore();
    }
}

// Mouse event handling for dragging
let selectedChip = null;
let offsetX = 0, offsetY = 0;

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    selectedChip = chips.find(chip => {
        const scaledWidth = CONFIG.chipWidth * CONFIG.chipScale;
        const scaledHeight = CONFIG.chipHeight * CONFIG.chipScale;
        const halfWidth = scaledWidth / 2;
        const halfHeight = scaledHeight / 2;
        const centerX = chip.x + halfWidth;
        const centerY = chip.y + halfHeight;
        const angle = (chip.rotation * Math.PI) / 180;
        const dx = mouseX - centerX;
        const dy = mouseY - centerY;
        const cos = Math.cos(-angle);
        const sin = Math.sin(-angle);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        const inBounds = localX >= -halfWidth && localX <= halfWidth &&
                         localY >= -halfHeight && localY <= halfHeight;
        return inBounds;
    });

    if (selectedChip) {
        lastSelectedChip = selectedChip;
        selectedChip.isDragging = true;
        offsetX = mouseX - selectedChip.x;
        offsetY = mouseY - selectedChip.y;
    } else {
        lastSelectedChip = null; // Deselect if no chip is clicked
    }
    draw(); // Redraw to update highlight
});

canvas.addEventListener('mousemove', (e) => {
    if (selectedChip && selectedChip.isDragging) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        selectedChip.x = mouseX - offsetX;
        selectedChip.y = mouseY - offsetY;

        draw();
    }
});

canvas.addEventListener('mouseup', () => {
    if (selectedChip) {
        // Check if chip is in any valid region (green debug border area)
        const validChip = isChipInValidRegion(selectedChip);
        if (validChip) {
            // Snap to valid position only (retain current rotation)
            selectedChip.x = validChip.x;
            selectedChip.y = validChip.y;
            // Play click-clack sound
            playClick();
            if (CONFIG.showDebugOutput) {
                console.log(`Snapped ${selectedChip.name} to valid position: x=${validChip.x}, y=${validChip.y}, rotation=${selectedChip.rotation} (retained)`);
            }
        }

        selectedChip.isDragging = false;
        selectedChip = null;
        draw(); // Redraw to update position
    }
});

// Rotate last selected chip on 'r' keypress
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        if (lastSelectedChip) {
            rotateChip(lastSelectedChip.name);
        }
    }
});

// Turn ON button events
const turnOnButton = document.getElementById('turnOn');
turnOnButton.addEventListener('mousedown', () => {
    if (CONFIG.showDebugOutput) {
        console.log('Turn ON button pressed');
    }
    initializeAudioContext(); // Ensure AudioContext is ready
    isTurnOnPressed = true;
    const chipStates = validateChipConfiguration();
    if (CONFIG.showDebugOutput) {
        console.log('Chip states:', chipStates); // Debug log for chip states
    }
    const incorrectCount = chipStates.filter(state => !state.isCorrect).length;
    if (CONFIG.showDebugOutput) {
        console.log('Incorrect chip count:', incorrectCount);
    }

    // Play sound based on validation result
    if (incorrectCount === 0) {
        // All chips are correct - play fanfare and stop timer
        playBeep({
            notes: [
                { hz: 261.63, duration: 0.15 }, // C4 (1 - lowest)
                { hz: 329.63, duration: 0.15 }, // E4 (2)
                { hz: 392.00, duration: 0.15 }, // G4 (3)
                { hz: 523.25, duration: 0.3 }, // C5 (4 - highest)
                { hz: 329.63, duration: 0.15 }, // E4 (2)
                { hz: 523.25, duration: 0.3 }   // C5 (4 - longer final note)
            ],
            volume: 0.05 // Consistent volume
        });
        if (timerRunning) {
            timerElapsed = Math.min(3599, (performance.now() - timerStart) / 1000);
            timerRunning = false;
            stopTimerInterval(); // Stop redraw interval
        }
    } else if (incorrectCount >= 1) {
        playBeep({
            notes: [
                { hz: 140.94, duration: 0.1 },
                { hz: 140.94, duration: 0.2 }
            ],
            volume: 0.05
        });
    }

    draw();
});

turnOnButton.addEventListener('mouseup', () => {
    isTurnOnPressed = false;
    draw();
});

// Resolve button event
const resolveButton = document.getElementById('resolve');
resolveButton.addEventListener('click', () => {
    resolveGame();
});

// Restart button event
const restartButton = document.getElementById('restart');
restartButton.addEventListener('click', () => {
    restartGame();
});

// Initial draw
draw();

// Turn off instruction text
setTimeout(() => {
    showInstruction = false;
    draw(); // Redraw to remove text
}, 5000); // 5 seconds