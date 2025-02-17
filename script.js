// script.js for Metrobars Metronome Web App

// Global variables
let bpm = 120;
let beatInterval = 60000 / bpm; // in ms
let metronomeInterval = null;
let isPaused = false;
let barsCount = 0;
let beatCount = 0;
let beatsPerBar = 4; // assuming 4 beats per bar
let tapTimes = [];
let volume = 0.3;
let audioContext = null;

// DOM Elements
const tempoValueEl = document.getElementById('tempoValue');
const barsCountEl = document.getElementById('barsCount');
const tempoSlider = document.getElementById('tempoSlider');
const volumeSlider = document.getElementById('volumeSlider');
const tapBtn = document.getElementById('tapBtn');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const timeSignatureSelect = document.getElementById('timeSignatureSelect');

// Utility function to play a click sound using Web Audio API
function playClickSound() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Create an oscillator
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // set frequency for click sound (a short beep)
  oscillator.frequency.value = 1000; // Hz
  gainNode.gain.value = volume;

  oscillator.start();
  // stop oscillator after 50ms for a short click sound
  oscillator.stop(audioContext.currentTime + 0.05);
}

// Function to play accented click sound for beat 1
function playAccentedClickSound() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Set a higher frequency for the accented beat
  oscillator.frequency.value = 1500; // Hz for beat 1
  gainNode.gain.value = volume;

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.05);
}

// Function to update the displayed BPM and current bar
function updateDisplay() {
  tempoValueEl.textContent = bpm;
  // Show current bar (add 1 since we want to display bars starting from 1)
  barsCountEl.textContent = (barsCount % beatsPerBar === 0) ? Math.floor(beatCount / beatsPerBar) + 1 : Math.floor(beatCount / beatsPerBar) + 1;
}

// Metronome tick function
function tick() {
  beatCount++;
  // If it's the first beat of the measure
  if ((beatCount - 1) % beatsPerBar === 0) {
    playAccentedClickSound();
  } else {
    playClickSound();
  }
  updateDisplay(); // Update display on every beat to show current bar
}

// Start the metronome
function startMetronome() {
  if (metronomeInterval && !isPaused) return; // already running

  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  } else if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  // If resumed from pause, do not reset counters
  if (!isPaused) {
    // fresh start
    beatCount = 0;
    barsCount = 0;
    updateDisplay();
  }

  beatInterval = 60000 / bpm;
  metronomeInterval = setInterval(tick, beatInterval);
  isPaused = false;
}

// Pause the metronome
function pauseMetronome() {
  if (metronomeInterval) {
    clearInterval(metronomeInterval);
    metronomeInterval = null;
    isPaused = true;
  }
}

// Stop the metronome and reset counters
function stopMetronome() {
  if (metronomeInterval) {
    clearInterval(metronomeInterval);
    metronomeInterval = null;
  }
  isPaused = false;
  beatCount = 0;
  barsCount = 0;
  tapTimes = [];
  barsCountEl.textContent = "1"; // Reset to show bar 1
}

// Adjust tempo change handling
tempoSlider.addEventListener('input', function () {
  bpm = parseInt(this.value);
  updateDisplay();
  // If metronome is running, restart the interval with new BPM
  if (metronomeInterval) {
    clearInterval(metronomeInterval);
    beatInterval = 60000 / bpm;
    metronomeInterval = setInterval(tick, beatInterval);
  }
});

// Adjust volume handling
volumeSlider.addEventListener('input', function () {
  volume = parseInt(this.value) / 100;
});

// Tap tempo functionality
tapBtn.addEventListener('click', function () {
  const now = Date.now();
  tapTimes.push(now);
  // Only keep last 5 taps
  if (tapTimes.length > 5) {
    tapTimes.shift();
  }
  if (tapTimes.length >= 2) {
    let intervals = [];
    for (let i = 1; i < tapTimes.length; i++) {
      intervals.push(tapTimes[i] - tapTimes[i - 1]);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    bpm = Math.round(60000 / avgInterval);
    // Limit bpm to slider bounds
    if (bpm < parseInt(tempoSlider.min)) bpm = parseInt(tempoSlider.min);
    if (bpm > parseInt(tempoSlider.max)) bpm = parseInt(tempoSlider.max);
    tempoSlider.value = bpm;
    updateDisplay();
    // If running, restart interval with new tempo
    if (metronomeInterval) {
      clearInterval(metronomeInterval);
      beatInterval = 60000 / bpm;
      metronomeInterval = setInterval(tick, beatInterval);
    }
  }
});

// Update time signature based on user selection and reset counters to sync measures
timeSignatureSelect.addEventListener('change', function() {
  const parts = this.value.split('/');
  if (parts.length === 2) {
    const num = parseInt(parts[0]);
    if (!isNaN(num) && num > 0) {
      beatsPerBar = num;
    } else {
      beatsPerBar = 4;
      this.value = "4/4";
    }
  } else {
    beatsPerBar = 4;
    this.value = "4/4";
  }
  // Reset the counters for a fresh start with the new time signature
  beatCount = 0;
  barsCount = 0;
  updateDisplay();
});

// Button event listeners
startBtn.addEventListener('click', startMetronome);
pauseBtn.addEventListener('click', pauseMetronome);
stopBtn.addEventListener('click', stopMetronome);

// Initial display update
updateDisplay();
