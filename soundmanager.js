import { gameState } from './gameState.js';

export let soundEffects = {};
export let backgroundMusic;

export function loadSounds() {
    const sfxList = ['click', 'move', 'level_complete', 'error', 'undo', 'reset', 'hint', 'buy', 'quest_complete', 'achievement'];
    sfxList.forEach(name => {
        const audioEl = new Audio(`assets/sounds/${name}.mp3`);
        soundEffects[name] = audioEl;
        soundEffects[name].volume = gameState.sfxVolume / 100;
    });

    backgroundMusic = document.getElementById('backgroundMusic');
    if (backgroundMusic) {
        backgroundMusic.volume = gameState.musicVolume / 100;
        backgroundMusic.loop = true;
        if (gameState.musicOn) {
            backgroundMusic.play().catch(e => {
                console.warn("Music auto-play prevented. User interaction might be needed.", e);
            });
        }
    }
}

export function playSound(name) {
    if (gameState.sfxOn && soundEffects[name]) {
        soundEffects[name].currentTime = 0;
        soundEffects[name].play().catch(e => console.log(`Error playing ${name} sound:`, e));
    }
}

export function toggleMusic() {
    gameState.musicOn = !gameState.musicOn;
    if (gameState.musicOn) {
        if (backgroundMusic) {
            backgroundMusic.play().catch(e => {
                console.warn("Music auto-play prevented:", e);
            });
        }
    } else {
        if (backgroundMusic) {
            backgroundMusic.pause();
        }
    }
    window.updateLanguageUI();
    window.saveGame();
}

export function toggleSfx() {
    gameState.sfxOn = !gameState.sfxOn;
    window.updateLanguageUI();
    window.saveGame();
}

export function updateMusicVolume() {
    gameState.musicVolume = parseInt(window.musicVolumeSlider.value);
    if (backgroundMusic) {
        backgroundMusic.volume = gameState.musicVolume / 100;
    }
    window.saveGame();
}

export function updateSfxVolume() {
    gameState.sfxVolume = parseInt(window.sfxVolumeSlider.value);
    for (const key in soundEffects) {
        if (soundEffects.hasOwnProperty(key)) {
            soundEffects[key].volume = gameState.sfxVolume / 100;
        }
    }
    window.saveGame();
}
