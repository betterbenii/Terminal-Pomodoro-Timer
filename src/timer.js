const path = require('path');
const notifier = require('node-notifier');
const fs = require('fs'); // Import file system module for saving history
const player = require('play-sound')({
    player: 'c:\\mpg123\\mpg123-1.32.6-static-x86-64\\mpg123.exe'  // Path to the sound player
});

/**
 * Class representing a customizable Pomodoro Timer.
 */
class PomodoroTimer {
    /**
     * Creates a new PomodoroTimer instance.
     * 
     * @param {number} workDuration - The duration of work sessions in seconds.
     * @param {number} shortBreak - The duration of short breaks in seconds.
     * @param {number} longBreak - The duration of long breaks in seconds.
     * @param {number} cycles - The number of cycles before a long break.
     * @param {readline.Interface} rl - The readline interface to handle user input.
     * @param {Function} startNewSessionCallback - Callback to start a new session.
     */
    constructor(workDuration, shortBreak, longBreak, cycles, rl, startNewSessionCallback) {
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
        this.historyFile = 'pomodoro_history.txt'; // File path for session history
        this.totalWorkTime = 0;  // Total time spent in work sessions
        this.totalBreakTime = 0; // Total time spent in break sessions
        this.completedPomodoroSessions = 0;  // Count of completed work sessions
    }

    /**
     * Formats time from seconds into a MM:SS string format.
     * 
     * @param {number} seconds - The number of seconds to format.
     * @returns {string} The formatted time string in MM:SS format.
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    /**
     * Plays a sound notification at the start or end of a session.
     */
    playSound() {
        const soundPath = path.join(__dirname, '../sounds/bell.mp3');
        player.play(soundPath, (err) => {
            if (err) console.error('Error playing sound:', err);
        });
    }

    /**
     * Sends a desktop notification with the given title and message.
     * 
     * @param {string} title - The title of the notification.
     * @param {string} message - The message content of the notification.
     */
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
        this.playSound(); // Play a sound along with the notification
    }

    /**
     * Saves the current session to the history file.
     * 
     * @param {string} sessionType - The type of session (Work/Break).
     * @param {number} duration - The duration of the session in minutes.
     */
    saveSessionToFile(sessionType, duration) {
        const sessionDate = new Date().toLocaleString();
        const totalWorkMinutes = Math.floor(this.totalWorkTime / 60);
        const totalBreakMinutes = Math.floor(this.totalBreakTime / 60);

        const sessionData = 
`Session: ${sessionType}
Date: ${sessionDate}
Duration: ${duration} minutes
Total Work Time: ${totalWorkMinutes} minutes
Total Break Time: ${totalBreakMinutes} minutes
Completed Pomodoro Sessions: ${this.completedPomodoroSessions}
---`;

        fs.appendFile(this.historyFile, sessionData, (err) => {
            if (err) throw err;
            console.log('Session history saved.');
        });
    }
    /**
     * Starts the timer for the current work or break session.
     */
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
        this.countdown(this.remainingTime); // Start the countdown
    }

    /**
     * Handles the countdown logic, updating the time remaining every second.
     * 
     * @param {number} duration - The initial duration of the session in seconds.
     */
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

    /**
     * Pauses the ongoing session.
     */
    pause() {
        if (this.isRunning && !this.isPaused) {
            clearInterval(this.intervalId);
            this.isPaused = true;
            console.log('\nTimer paused.');
        }
    }

    /**
     * Resumes the paused session.
     */
    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            console.log('Timer resumed.');
            this.countdown(this.remainingTime);
        }
    }

    /**
     * Stops the current session and asks the user whether to start a new session.
     */
    stop() {
        if (this.isRunning) {
            clearInterval(this.intervalId);
            this.isRunning = false;
            this.isPaused = false;
            console.log('\nTimer stopped.');
            this.promptRestartOrExit();
        }
    }

    /**
     * Resets the timer to its initial settings and restarts.
     */
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

    /**
     * Prompts the user to either restart or exit after stopping the timer.
     */
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
                this.promptRestartOrExit();
            }
        });
    }

    /**
     * Completes the current session, switches between work and break, 
     * and updates the session history.
     */
    completeSession() {
        const sessionType = this.isWorking ? 'Work' : 'Break';
        const sessionDuration = this.isWorking ? this.workDuration / 60 : this.shortBreak / 60;
        if (this.isWorking) {
            this.totalWorkTime += this.workDuration;
            this.completedPomodoroSessions++;
        } else {
            this.totalBreakTime += this.shortBreak;
        }

        this.saveSessionToFile(sessionType, sessionDuration);
        this.isWorking = !this.isWorking;
        this.currentCycle++;
        console.log("\nSession complete. Press 'Enter' to start the next session.");
        this.rl.once('line', () => {
            this.start();
        });
    }
}

module.exports = PomodoroTimer;