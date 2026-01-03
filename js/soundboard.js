class Soundboard {
  constructor() {
    this.currentMode = 'instant';
    this.currentAudio = null;
    this.queue = [];
    this.sounds = [];
    this.isPlayingQueue = false;
    this.totalQueueItems = 0;
    this.completedQueueItems = 0;
    this.totalQueueDuration = 0;
    this.completedQueueDuration = 0;
    this.currentQueueAudio = null;
    this.currentProgressAnimationId = null;
    
    this.init();
  }

  async init() {
    await this.loadSounds();
    this.setupEventListeners();
    this.renderSoundboard();
    this.getCurrentMode(); // Get the actual selected mode from DOM
    this.updateModeDisplay(); // Ensure mode display is set on page load
  }

  async loadSounds() {
    try {
      const response = await fetch('data/sounds.json');
      const data = await response.json();
      this.sounds = data.sections;
    } catch (error) {
      console.error('Error loading sounds:', error);
    }
  }

  getCurrentMode() {
    const selectedMode = document.querySelector('input[name="mode"]:checked');
    this.currentMode = selectedMode ? selectedMode.value : 'instant';
  }

  setupEventListeners() {
    // Mode toggle
    const modeInputs = document.querySelectorAll('input[name="mode"]');
    modeInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.currentMode = e.target.value;
        this.updateModeDisplay();
      });
    });

    // Queue play button
    const playQueueBtn = document.getElementById('play-queue-btn');
    if (playQueueBtn) {
      playQueueBtn.setAttribute('aria-label', 'Play queued sounds');
      playQueueBtn.addEventListener('click', () => {
        this.playQueue();
      });
      // Keyboard support
      playQueueBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.playQueue();
        }
      });
    }
  }

  updateModeDisplay() {
    const queueButton = document.getElementById('queue-play-button');
    if (this.currentMode === 'queue') {
      queueButton.classList.remove('hidden');
    } else {
      queueButton.classList.add('hidden');
      // Clear queue when switching to instant mode
      this.queue = [];
      this.updateQueueDisplay();
      this.clearAllQueuedButtons();
    }
  }

  renderSoundboard() {
    const container = document.getElementById('soundboard-container');
    container.innerHTML = '';

    this.sounds.forEach(section => {
      const sectionElement = this.createSection(section);
      container.appendChild(sectionElement);
    });
  }

  createSection(section) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'sound-section';

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = section.title;
    sectionDiv.appendChild(title);

    const soundsGrid = document.createElement('div');
    soundsGrid.className = 'sounds-grid';

    section.sounds.forEach((sound, index) => {
      const soundButton = this.createSoundButton(sound, index);
      soundsGrid.appendChild(soundButton);
    });

    sectionDiv.appendChild(soundsGrid);
    return sectionDiv;
  }

  createSoundButton(sound, index) {
    const button = document.createElement('button');
    button.className = 'sound-button';
    button.dataset.sfx = sound.sfx;
    button.dataset.index = index;
    button.setAttribute('aria-label', `Play sound: ${sound.text}`);
    button.setAttribute('type', 'button');

    const emoji = document.createElement('div');
    emoji.className = 'sound-emoji';
    emoji.textContent = sound.emoji;
    emoji.setAttribute('aria-hidden', 'true');

    const text = document.createElement('div');
    text.className = 'sound-text';
    text.textContent = sound.text;

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';

    const queueNumber = document.createElement('div');
    queueNumber.className = 'queue-number';
    queueNumber.style.display = 'none';

    button.appendChild(emoji);
    button.appendChild(text);
    button.appendChild(progressBar);
    button.appendChild(queueNumber);

    button.addEventListener('click', () => {
      this.handleSoundClick(sound, button);
    });
    
    // Keyboard support
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleSoundClick(sound, button);
      }
    });

    return button;
  }

  handleSoundClick(sound, button) {
    if (this.currentMode === 'instant') {
      this.playInstant(sound, button);
    } else {
      this.addToQueue(sound, button);
    }
  }

  playInstant(sound, button) {
    // Stop current audio if playing
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.resetAllButtons();
    }

    // Cancel any existing progress bar animation
    if (this.currentProgressAnimationId) {
      cancelAnimationFrame(this.currentProgressAnimationId);
      this.currentProgressAnimationId = null;
    }

    // Play new sound
    this.currentAudio = new Audio(sound.sfx);
    button.classList.add('playing');

    // Set up smooth progress bar updates
    const updateProgress = () => {
      if (this.currentAudio.duration && !this.currentAudio.paused) {
        const progress = (this.currentAudio.currentTime / this.currentAudio.duration) * 100;
        button.querySelector('.progress-bar').style.width = progress + '%';
        this.currentProgressAnimationId = requestAnimationFrame(updateProgress);
      }
    };

    // Reset when finished
    this.currentAudio.addEventListener('ended', () => {
      if (this.currentProgressAnimationId) {
        cancelAnimationFrame(this.currentProgressAnimationId);
        this.currentProgressAnimationId = null;
      }
      button.classList.remove('playing');
      button.querySelector('.progress-bar').style.width = '0%';
    });

    this.currentAudio.play().then(() => {
      // Start smooth progress updates
      updateProgress();
    }).catch(error => {
      console.error('Error playing audio:', error);
      button.classList.remove('playing');
      if (this.currentProgressAnimationId) {
        cancelAnimationFrame(this.currentProgressAnimationId);
        this.currentProgressAnimationId = null;
      }
    });
  }

  addToQueue(sound, button) {
    // Check if already in queue - if so, remove it
    if (button.classList.contains('queued')) {
      this.removeFromQueue(button);
      return;
    }

    this.queue.push({
      sound: sound,
      button: button,
      audio: new Audio(sound.sfx)
    });

    button.classList.add('queued');
    const queueNumber = button.querySelector('.queue-number');
    queueNumber.textContent = this.queue.length;
    queueNumber.style.display = 'flex';

    this.updateQueueDisplay();
  }

  removeFromQueue(button) {
    // Find and remove the item from the queue
    const index = this.queue.findIndex(item => item.button === button);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }

    // Remove visual queue state
    button.classList.remove('queued');
    const queueNumber = button.querySelector('.queue-number');
    queueNumber.style.display = 'none';

    // Update all queue numbers for remaining items
    this.updateAllQueueNumbers();
    this.updateQueueDisplay();
  }

  updateAllQueueNumbers() {
    // Update the queue numbers on all queued buttons to reflect their position
    this.queue.forEach((item, index) => {
      const queueNumber = item.button.querySelector('.queue-number');
      queueNumber.textContent = index + 1;
    });
  }

  updateQueueProgress() {
    const progressBar = document.querySelector('.queue-progress-bar');
    if (progressBar) {
      if (this.totalQueueDuration > 0 && this.currentQueueAudio) {
        // Calculate smooth progress based on actual audio playback time
        const currentAudioProgress = this.currentQueueAudio.currentTime || 0;
        const totalProgress = this.completedQueueDuration + currentAudioProgress;
        const progress = (totalProgress / this.totalQueueDuration) * 100;
        progressBar.style.width = progress + '%';
      } else if (this.totalQueueItems > 0) {
        // Fallback to item-based progress if durations aren't available
        const progress = (this.completedQueueItems / this.totalQueueItems) * 100;
        progressBar.style.width = progress + '%';
      } else {
        // Reset progress bar when no queue
        progressBar.style.width = '0%';
      }
    }
  }

  updateQueueDisplay() {
    const queueCount = document.getElementById('queue-count');
    if (queueCount) {
      queueCount.textContent = this.queue.length;
    }
    // Element may not exist during certain states - this is expected
  }

  async playQueue() {
    if (this.queue.length === 0 || this.isPlayingQueue) {
      return;
    }

    this.isPlayingQueue = true;
    this.totalQueueItems = this.queue.length;
    this.completedQueueItems = 0;
    this.completedQueueDuration = 0;
    
    const playQueueBtn = document.getElementById('play-queue-btn');
    playQueueBtn.disabled = true;
    
    // Update button text without destroying the progress bar structure
    let queueText = playQueueBtn.querySelector('.queue-text');
    if (queueText) {
      queueText.innerHTML = '⏸️ Playing...';
    }
    
    // Calculate total duration of all queue items
    this.totalQueueDuration = 0;
    for (const item of this.queue) {
      // Wait for audio metadata to load to get duration
      await new Promise(resolve => {
        if (item.audio.duration && !isNaN(item.audio.duration)) {
          this.totalQueueDuration += item.audio.duration;
          resolve();
        } else {
          item.audio.addEventListener('loadedmetadata', () => {
            this.totalQueueDuration += item.audio.duration;
            resolve();
          });
        }
      });
    }
    
    console.log(`Total queue duration: ${this.totalQueueDuration}s`);
    
    // Initialize progress bar
    this.updateQueueProgress();
    
    // Set up smooth progress updates using requestAnimationFrame
    let queueProgressAnimationId = null;
    const updateQueueProgressLoop = () => {
      if (this.isPlayingQueue) {
        this.updateQueueProgress();
        queueProgressAnimationId = requestAnimationFrame(updateQueueProgressLoop);
      }
    };
    updateQueueProgressLoop();

    // Process queue items one by one
    while (this.queue.length > 0) {
      console.log(`Playing queue item, ${this.queue.length} remaining`);
      const queueItem = this.queue.shift(); // Remove first item from queue
      const { sound, button, audio } = queueItem;

      console.log(`Playing: ${sound.text}`);

      // Update button to show it's currently playing
      button.classList.remove('queued');
      button.classList.add('playing');

      // Set current audio for queue progress tracking
      this.currentQueueAudio = audio;

      // Play the audio and wait for it to finish
      try {
        console.log(`Starting to play: ${sound.text}`);
        await this.playAudioWithProgress(audio, button);
        console.log(`Finished playing: ${sound.text}`);
      } catch (error) {
        console.error('Error playing audio:', error);
      }

      // Update progress tracking
      this.completedQueueItems++;
      this.completedQueueDuration += audio.duration || 0;
      this.currentQueueAudio = null;

      // Reset button after playing
      button.classList.remove('playing');
      button.querySelector('.progress-bar').style.width = '0%';
      button.querySelector('.queue-number').style.display = 'none';

      // Update queue display after each item
      this.updateQueueDisplay();
    }

    // Clear queue and reset UI
    this.queue = [];
    this.isPlayingQueue = false;
    this.currentQueueAudio = null;
    playQueueBtn.disabled = false;
    
    // Stop the animation loop (it will stop automatically when isPlayingQueue becomes false)
    
    // Fade out the progress bar
    const progressBar = document.querySelector('.queue-progress-bar');
    if (progressBar) {
      progressBar.classList.add('fade-out');
      
      // Reset after fade-out completes
      setTimeout(() => {
        progressBar.classList.remove('fade-out');
        this.totalQueueItems = 0;
        this.completedQueueItems = 0;
        this.totalQueueDuration = 0;
        this.completedQueueDuration = 0;
        this.updateQueueProgress();
      }, 200); // Match the CSS transition time
    } else {
      // If progress bar not found, reset immediately
      this.totalQueueItems = 0;
      this.completedQueueItems = 0;
      this.totalQueueDuration = 0;
      this.completedQueueDuration = 0;
      this.updateQueueProgress();
    }
    
    // Reset button text without destroying the progress bar structure
    queueText = playQueueBtn.querySelector('.queue-text');
    if (queueText) {
      queueText.innerHTML = '▶️ Play Queue (<span id="queue-count">0</span>)';
    }
    
    // Ensure the queue count element exists after updating
    this.updateQueueDisplay();
  }

  playAudioWithProgress(audio, button) {
    return new Promise((resolve, reject) => {
      let animationId = null;
      
      // Set up smooth progress bar updates
      const updateProgress = () => {
        if (audio.duration && !audio.paused) {
          const progress = (audio.currentTime / audio.duration) * 100;
          button.querySelector('.progress-bar').style.width = progress + '%';
          animationId = requestAnimationFrame(updateProgress);
        }
      };

      // Set up completion handler
      const onEnded = () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        resolve();
      };

      // Set up error handler
      const onError = (error) => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        reject(error);
      };

      // Add event listeners
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);
      
      // Start playing and begin smooth progress updates
      audio.play().then(() => {
        updateProgress(); // Start the animation loop
      }).catch(reject);
    });
  }

  playAudio(audio) {
    return new Promise((resolve, reject) => {
      audio.addEventListener('ended', resolve);
      audio.addEventListener('error', reject);
      audio.play().catch(reject);
    });
  }

  clearAllQueuedButtons() {
    const buttons = document.querySelectorAll('.sound-button');
    buttons.forEach(button => {
      button.classList.remove('queued');
      const queueNumber = button.querySelector('.queue-number');
      if (queueNumber) {
        queueNumber.style.display = 'none';
      }
    });
  }

  resetAllButtons() {
    const buttons = document.querySelectorAll('.sound-button');
    buttons.forEach(button => {
      button.classList.remove('playing');
      button.querySelector('.progress-bar').style.width = '0%';
    });
  }
}

// Initialize soundboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Soundboard();
});
