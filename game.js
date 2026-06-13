class DragonGame {
    constructor() {
        this.level = 1;
        this.score = 0;
        this.dragonHealth = 20;
        this.dragonMaxHealth = 20;
        this.isWarriorLooking = false;
        this.gameActive = true;
        this.turnInterval = null;
        this.audioContext = null;
        this.pendingTimeouts = [];
        this.damageHistory = [];
        this.dps = 0;
        
        this.initElements();
        this.initEventListeners();
        this.initAudio();
        this.startLevel();
    }

    initElements() {
        this.dragon = document.getElementById('dragon');
        this.warrior = document.getElementById('warrior');
        this.warriorHead = document.querySelector('.warrior-head');
        this.hitButton = document.getElementById('hit-button');
        this.message = document.getElementById('message');
        this.levelDisplay = document.getElementById('level-display');
        this.scoreDisplay = document.getElementById('score-display');
        this.dragonHealthBar = document.getElementById('dragon-health-bar');
        this.dragonHealthText = document.getElementById('dragon-health-text');
        this.warriorStatus = document.getElementById('warrior-status');
        this.damageNumbers = document.getElementById('damage-numbers');
        this.dpsDisplay = document.getElementById('dps-display');
        this.gameOverModal = document.getElementById('game-over-modal');
        this.gameOverTitle = document.getElementById('game-over-title');
        this.gameOverMessage = document.getElementById('game-over-message');
        this.restartButton = document.getElementById('restart-button');
    }

    initEventListeners() {
        this.hitButton.addEventListener('click', () => this.hitDragon());
        this.restartButton.addEventListener('click', () => this.restart());
    }

    initAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    playHitSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    playWinSound() {
        if (!this.audioContext) return;
        
        const notes = [262, 330, 392, 523];
        notes.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * 0.1);
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + index * 0.1);
            gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + index * 0.1 + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + index * 0.1 + 0.2);
            
            oscillator.start(this.audioContext.currentTime + index * 0.1);
            oscillator.stop(this.audioContext.currentTime + index * 0.1 + 0.2);
        });
    }

    playLoseSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    startLevel() {
        this.dragonMaxHealth = 80 + (this.level - 1) * 40;
        this.dragonHealth = this.dragonMaxHealth;
        this.gameActive = true;
        
        this.warriorHead.textContent = '😌';
        this.warriorStatus.textContent = 'Looking Away';
        this.warriorStatus.classList.remove('danger');
        this.warriorStatus.classList.add('safe');
        
        this.updateDisplay();
        this.startWarriorBehavior();
        
        this.showMessage(`Level ${this.level} - Dragon Health: ${this.dragonMaxHealth}`, 'warning');
    }

    startWarriorBehavior() {
        if (this.turnInterval) {
            clearInterval(this.turnInterval);
        }
        
        this.clearAllTimeouts();

        const baseInterval = 3000;
        const levelDifficulty = Math.max(500, baseInterval - (this.level - 1) * 300);
        
        const minTurnTime = Math.max(1000, levelDifficulty - 500);
        const maxTurnTime = Math.max(2000, levelDifficulty + 1000);

        this.scheduleNextTurn(minTurnTime, maxTurnTime);
    }

    scheduleNextTurn(minTime, maxTime) {
        if (!this.gameActive) return;

        const randomTime = Math.random() * (maxTime - minTime) + minTime;
        
        const turnTimeout = setTimeout(() => {
            if (!this.gameActive) return;
            
            this.toggleWarriorLooking();
            
            const lookDuration = Math.max(300, 1000 - (this.level - 1) * 100);
            const lookTimeout = setTimeout(() => {
                if (this.gameActive) {
                    this.toggleWarriorLooking();
                    this.scheduleNextTurn(minTime, maxTime);
                }
            }, lookDuration);
            this.pendingTimeouts.push(lookTimeout);
        }, randomTime);
        this.pendingTimeouts.push(turnTimeout);
    }

    clearAllTimeouts() {
        this.pendingTimeouts.forEach(timeout => clearTimeout(timeout));
        this.pendingTimeouts = [];
    }

    toggleWarriorLooking() {
        this.isWarriorLooking = !this.isWarriorLooking;
        
        if (this.isWarriorLooking) {
            this.warrior.classList.remove('looking-away');
            this.warrior.classList.add('looking-at-you');
            this.warriorHead.textContent = '😠';
            this.warriorStatus.textContent = '👀 WATCHING!';
            this.warriorStatus.classList.remove('safe');
            this.warriorStatus.classList.add('danger');
        } else {
            this.warrior.classList.remove('looking-at-you');
            this.warrior.classList.add('looking-away');
            this.warriorHead.textContent = '😌';
            this.warriorStatus.textContent = 'Looking Away';
            this.warriorStatus.classList.remove('danger');
            this.warriorStatus.classList.add('safe');
        }
    }

    hitDragon() {
        if (!this.gameActive) return;

        if (this.isWarriorLooking) {
            this.gameOver(false);
            return;
        }

        this.playHitSound();
        this.showDamageNumber(-5);
        this.recordDamage(5);
        
        this.dragon.classList.add('hit');
        setTimeout(() => this.dragon.classList.remove('hit'), 300);

        this.dragonHealth -= 5;
        this.score += 5;

        if (this.dragonHealth <= 0) {
            this.levelComplete();
        } else {
            this.showMessage('💥 Hit! Keep going!', 'success');
        }

        this.updateDisplay();
    }

    levelComplete() {
        this.gameActive = false;
        if (this.turnInterval) {
            clearInterval(this.turnInterval);
        }

        this.playWinSound();
        this.showMessage(`🎉 Level ${this.level} Complete!`, 'success');

        setTimeout(() => {
            this.level++;
            this.startLevel();
        }, 2000);
    }

    gameOver(victory) {
        this.gameActive = false;
        if (this.turnInterval) {
            clearInterval(this.turnInterval);
        }

        if (victory) {
            this.playWinSound();
            this.gameOverTitle.textContent = '🏆 Victory!';
            this.gameOverMessage.textContent = `You defeated all mobs! Final Damage: ${this.score}`;
        } else {
            this.playLoseSound();
            this.gameOverTitle.textContent = '💀 Caught by Pants!';
            this.gameOverMessage.textContent = `Pants saw you attack! You reached Level ${this.level} with ${this.score} damage.`;
        }

        this.gameOverModal.classList.remove('hidden');
    }

    restart() {
        this.gameOverModal.classList.add('hidden');
        this.clearAllTimeouts();
        this.level = 1;
        this.score = 0;
        this.damageHistory = [];
        this.dps = 0;
        this.isWarriorLooking = false;
        
        this.warrior.classList.remove('looking-at-you');
        this.warrior.classList.add('looking-away');
        
        this.warriorStatus.textContent = 'Looking Away';
        this.warriorStatus.classList.remove('danger');
        this.warriorStatus.classList.add('safe');
        
        this.startLevel();
    }

    recordDamage(damage) {
        const now = Date.now();
        this.damageHistory.push({ damage, timestamp: now });
        
        this.damageHistory = this.damageHistory.filter(entry => now - entry.timestamp < 1000);
        
        const totalDamage = this.damageHistory.reduce((sum, entry) => sum + entry.damage, 0);
        this.dps = totalDamage;
        
        this.updateDisplay();
    }

    updateDisplay() {
        this.levelDisplay.textContent = `Level: ${this.level}`;
        this.scoreDisplay.textContent = `Total Damage: ${this.score}`;
        this.dpsDisplay.textContent = `DPS: ${this.dps.toFixed(1)}`;
        
        const healthPercent = (this.dragonHealth / this.dragonMaxHealth) * 100;
        this.dragonHealthBar.style.width = `${healthPercent}%`;
        this.dragonHealthText.textContent = `Health: ${this.dragonHealth}/${this.dragonMaxHealth}`;
    }

    showDamageNumber(damage) {
        const damageEl = document.createElement('div');
        damageEl.className = 'damage-number';
        damageEl.textContent = damage;
        
        this.damageNumbers.appendChild(damageEl);
        
        setTimeout(() => {
            damageEl.remove();
        }, 1000);
    }

    showMessage(text, type) {
        this.message.textContent = text;
        this.message.className = `message ${type}`;
        
        setTimeout(() => {
            if (this.message.textContent === text) {
                this.message.textContent = '';
                this.message.className = 'message';
            }
        }, 2000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DragonGame();
});
