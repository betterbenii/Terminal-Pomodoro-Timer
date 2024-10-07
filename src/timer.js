const path = require('path');
const notifier = require('node-notifier');
const fs = require('fs'); // Import file system module for saving history
const player = require('play-sound')({
    player: 'c:\\mpg123\\mpg123-1.32.6-static-x86-64\\mpg123.exe'  // Path to the sound player
});

// Class to manage Pomodoro Timer functionality
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
        this.rl = rl;
        this.startNewSessionCallback = startNewSessionCallback;
        this.historyFile = 'pomodoro_history.txt';  // Path for the session history file

        // Add new variables to track totals
        this.totalWorkTime = 0;  // In seconds
        this.totalBreakTime = 0;  // In seconds
        this.completedPomodoroSessions = 0;  // Count of work sessions
    }

    // Helper function to format time (MM:SS)
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // Play sound notification at session start/end
    playSound() {
        const soundPath = path.join(__dirname, '../sounds/bell.mp3'); // Path to bell sound
        player.play(soundPath, (err) => {
            if (err) console.error('Error playing sound:', err);
        });
    }

    // Send a desktop notification at session start/end
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
        this.playSound(); // Play sound with notification
    }

    // Save session data to the history file after each session
    saveSessionToFile(sessionType, duration) {
        const sessionDate = new Date().toLocaleString(); // Get current date/time
        const totalWorkMinutes = Math.floor(this.totalWorkTime / 60);  // Convert total work time to minutes
        const totalBreakMinutes = Math.floor(this.totalBreakTime / 60);  // Convert total break time to minutes

        const sessionData = `
Session: ${sessionType}
Date: ${sessionDate}
Duration: ${duration} minutes
Total Work Time: ${totalWorkMinutes} minutes
Total Break Time: ${totalBreakMinutes} minutes
Completed Pomodoro Sessions: ${this.completedPomodoroSessions}
---`;

        fs.appendFile(this.historyFile, sessionData, (err) => {
            if (err) throw err;
            console.log('Session history saved.'); // Confirm session save
        });
    }

    // Start the timer (for both work and break sessions)
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
        this.countdown(this.remainingTime); // Start countdown
    }
    // Handle the countdown logic for the timer
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
                this.completeSession(); // Handle session completion
                this.sendNotification('Session Ended');
            }
        }, 1000);
    }

    // Pause the timer
    pause() {
        if (this.isRunning && !this.isPaused) {
            clearInterval(this.intervalId);
            this.isPaused = true;
            console.log('\nTimer paused.');
        }
    }

    // Resume the timer
    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            console.log('Timer resumed.');
            this.countdown(this.remainingTime);
        }
    }

    // Stop the timer and ask if the user wants to restart
    stop() {
        if (this.isRunning) {
            clearInterval(this.intervalId);
            this.isRunning = false;
            this.isPaused = false;
            console.log('\nTimer stopped.');
            this.promptRestartOrExit();
        }
    }

    // Reset the timer back to its initial settings
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
            this.start(); // Start again after reset
        });
    }

    // Prompt the user if they want to restart or exit after stopping the timer
    promptRestartOrExit() {
        this.rl.question('Would you like to start a new session? (Y/N) ', (input) => {
            const response = String(input).trim().toUpperCase();
            if (response === 'Y') {
                console.log('Starting a new session...');
                this.startNewSessionCallback();
            } else if (response === 'N') {
                console.log('\nThank you for using this timer!\n');
                this.rl.close();
                process.exit(0);
            } else {
                console.log('Invalid input. Please enter Y or N.');
                this.promptRestartOrExit();  // Re-prompt if invalid input
            }
        });
    }

    // Handle the logic when a session (work/break) completes
    completeSession() {
        const sessionType = this.isWorking ? 'Work' : 'Break'; // Determine session type
        const sessionDuration = this.isWorking ? this.workDuration / 60 : this.shortBreak / 60; // Calculate duration in minutes

        // Update total work/break times and number of completed Pomodoros
        if (this.isWorking) {
            this.totalWorkTime += this.workDuration;
            this.completedPomodoroSessions++;  // Count each completed work session
        } else {
            this.totalBreakTime += this.shortBreak;
        }

        this.saveSessionToFile(sessionType, sessionDuration); // Save session to history file

        this.isWorking = !this.isWorking; // Toggle between work and break
        this.currentCycle++;
        console.log("\nSession complete. Press 'Enter' to start the next session.");
        this.rl.once('line', () => {
            this.start(); // Start next session
        });
    }
}

module.exports = PomodoroTimer;