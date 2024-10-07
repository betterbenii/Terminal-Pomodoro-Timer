const path = require('path');
const notifier = require('node-notifier');
const player = require('play-sound')({
    player: 'c:\\mpg123\\mpg123-1.32.6-static-x86-64\\mpg123.exe'  // the actual path to mpg123
});

class PomodoroTimer {
    constructor(workDuration = 25 * 60, shortBreak = 5 * 60, longBreak = 15 * 60, cycles = 4, rl, startNewSessionCallback) {
        this.workDuration = workDuration;
        this.shortBreak = shortBreak;
        this.longBreak = longBreak;
        this.cycles = cycles;
        this.currentCycle = 0;
        this.isWorking = true;
        this.isRunning = false;
        this.isPaused = false;
        this.sessionNumber = 1;
        this.intervalId = null;
        this.remainingTime = this.workDuration;
        this.rl = rl;  // Store the readline instance from index.js
        this.startNewSessionCallback = startNewSessionCallback;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    playSound() {
        const soundPath = path.join(__dirname, '../sounds/bell.mp3');
        player.play(soundPath, (err) => {
            if (err) console.error('Error playing sound:', err);
        });
    }

    sendNotification(title, message) {
        notifier.notify({
            title: title,
            message: message || 'Pomodoro Timer Notification',
            sound: false,
            wait: false,
            type: 'info',
            appID: 'PomodoroTimer'
        }, (err) => {
            if (err) console.error('Notification error:', err);
        });
        this.playSound();
    }

    start() {
        if (this.isRunning) {
            console.log("The timer is already running!");
            return;
        }
        this.isRunning = true;
        this.isPaused = false;
        this.remainingTime = this.isWorking ? this.workDuration : this.shortBreak;

        const sessionType = this.isWorking ? 'Work' : 'Break';
        this.sendNotification(`${sessionType} session started`, `Time to ${this.isWorking ? 'work' : 'relax'}!`);

        console.log(`\nSession ${this.sessionNumber}: ${sessionType} session started!`);
        this.countdown(this.remainingTime);
    }

    countdown(duration) {
        this.remainingTime = duration;
        this.intervalId = setInterval(() => {
            if (this.remainingTime > 0) {
                this.remainingTime--;
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write(`Time remaining: ${this.formatTime(this.remainingTime)}`);
            } else {
                clearInterval(this.intervalId);
                this.isRunning = false;
                this.completeSession();
                this.sendNotification('Session Ended');
            }
        }, 1000);
    }

    pause() {
        if (this.isRunning && !this.isPaused) {
            clearInterval(this.intervalId);
            this.isPaused = true;
            console.log('\nTimer paused.');
        }
    }

    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            console.log('Timer resumed.');
            this.countdown(this.remainingTime);
        }
    }

    stop() {
        if (this.isRunning) {
            clearInterval(this.intervalId);
            this.isRunning = false;
            this.isPaused = false;
            console.log('\nTimer stopped.');
            this.promptRestartOrExit();
        }
    }

    reset() {
        clearInterval(this.intervalId);
        this.isRunning = false;
        this.isPaused = false;
        this.currentCycle = 0;
        this.sessionNumber = 1;
        this.isWorking = true;
        this.remainingTime = this.workDuration;
        console.log('Timer has been reset. Press "Enter" to start again with the same settings.');

        this.rl.once('line', () => {
            this.start();
        });
    }
    promptRestartOrExit() {
        this.rl.question('Would you like to start a new session? (Y/N) ', (input) => {
            const response = String(input).trim().toUpperCase();
            if (response === 'Y') {
                console.log('Starting a new session...');
                this.startNewSessionCallback();
            } else if (response === 'N') {
                console.log('Thank you for using this timer!');
                this.rl.close();
                process.exit(0);
            } else {
                console.log('Invalid input. Please enter Y or N.');
                this.promptRestartOrExit();  // Re-prompt if invalid input
            }
        });
    }

    completeSession() {
        this.isWorking = !this.isWorking;
        this.currentCycle++;
        console.log("\nSession complete. Press 'Enter' to start the next session.");
        this.rl.once('line', () => {
            this.start();
        });
    }
}

module.exports = PomodoroTimer;