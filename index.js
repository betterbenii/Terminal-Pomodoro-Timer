const readline = require('readline');
const PomodoroTimer = require('./src/timer');
const fs = require('fs');
const path = require('path');

// Path to the settings file
const settingsFilePath = path.join(__dirname, 'settings.json');

// Keep a persistent readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Displays the available command prompt to the user.
 * Includes commands for pause, resume, stop, reset, stats, and history.
 */
function showCommandPrompt() {
    console.log('Enter "p" to pause, "r" to resume, "s" to stop, "x" to reset, "help" to available commands, or "history" to view session history. Type "stats" to see your Pomodoro statistics.');
}

/**
 * Displays a help message listing all available commands and their descriptions.
 */
function showHelp() {
    console.log(`
Available Commands:
- "p": Pause the current session.
- "r": Resume the paused session.
- "s": Stop the current session and restart.
- "x": Reset the timer to the original settings.
- "history": View the session history from the file.
- "stats": View the total work time, break time, and completed Pomodoro sessions.
- "help": Display this help message.
    `);
}

/**
 * Displays Pomodoro statistics including total work time, total break time, 
 * and the number of completed Pomodoro sessions.
 * 
 * @param {PomodoroTimer} pomodoro - The PomodoroTimer instance to retrieve statistics from.
 */
function showStats(pomodoro) {
    console.log(`
    --- Pomodoro Statistics ---
    Total Work Time: ${Math.floor(pomodoro.totalWorkTime / 60)} minutes
    Total Break Time: ${Math.floor(pomodoro.totalBreakTime / 60)} minutes
    Completed Pomodoro Sessions: ${pomodoro.completedPomodoroSessions}
    `);
}

/**
 * Loads saved Pomodoro timer settings from the settings.json file.
 * If saved settings exist, prompts the user to choose a setting to load.
 * 
 * @param {Function} callback - Callback to continue after loading settings or entering new inputs.
 */
function loadSavedSettings(callback) {
    fs.readFile(settingsFilePath, 'utf8', (err, data) => {
        if (err || !data) {
            console.log("No saved settings.");
            return callback(); // No saved settings, proceed with new input
        }
        const settings = JSON.parse(data);
        console.log("\nSaved Settings:");
        settings.forEach((setting, index) => {
            console.log(`${index + 1}: Work: ${setting.workDuration / 60} mins, Short Break: ${setting.shortBreakDuration / 60} mins, Long Break: ${setting.longBreakDuration / 60} mins, Cycles: ${setting.cycles}`);
        });
        rl.question('Would you like to load a saved setting? (Y/N) ', (input) => {
            if (input.trim().toUpperCase() === 'Y') {
                rl.question('Enter the setting number to load: ', (num) => {
                    const settingIndex = parseInt(num) - 1;
                    if (settings[settingIndex]) {
                        const selectedSetting = settings[settingIndex];
                        console.log(`Loaded setting ${num}.`);
                        callback(selectedSetting);
                    } else {
                        console.log("Invalid setting number.");
                        loadSavedSettings(callback); // Re-prompt if invalid
                    }
                });
            } else {
                callback(); // Proceed with new input
            }
        });
    });
}

/**
 * Prompts the user to save the Pomodoro settings after entering them.
 * If the user chooses to save, the settings are stored in settings.json.
 * 
 * @param {Object} newSettings - The newly entered Pomodoro settings.
 * @param {Function} callback - Callback to start the timer after saving.
 */
function promptToSaveSettings(newSettings, callback) {
    rl.question('Would you like to save these inputs for future use? (Y/N) ', (input) => {
        if (input.trim().toUpperCase() === 'Y') {
            fs.readFile(settingsFilePath, 'utf8', (err, data) => {
                const settings = err || !data ? [] : JSON.parse(data);
                settings.push(newSettings); // Add new settings to the list
                fs.writeFile(settingsFilePath, JSON.stringify(settings, null, 2), (err) => {
                    if (err) throw err;
                    console.log("Inputs saved. You can load and use them anytime!");
                    callback(newSettings);
                });
            });
        } else {
            callback(newSettings); // Proceed without saving
        }
    });
}

/**
 * Initializes the Pomodoro timer setup process, either loading saved settings 
 * or allowing the user to input custom settings.
 */
function startPomodoroSetup() {
    console.log('\nWelcome to the Pomodoro Timer setup!');
    loadSavedSettings((loadedSetting) => {
        if (loadedSetting) {
            startTimer(loadedSetting); // Use the loaded setting
        } else {
            rl.question('Enter work duration in minutes (default is 25): ', (workInput) => {
                const workDuration = parseInt(workInput) * 60 || 25 * 60;
                rl.question('Enter short break duration in minutes (default is 5): ', (shortBreakInput) => {
                    const shortBreakDuration = parseInt(shortBreakInput) * 60 || 5 * 60;
                    rl.question('Enter long break duration in minutes (default is 15): ', (longBreakInput) => {
                        const longBreakDuration = parseInt(longBreakInput) * 60 || 15 * 60;
                        rl.question('Enter number of cycles before a long break (default is 4): ', (cyclesInput) => {
                            const cycles = parseInt(cyclesInput) || 4;
                            const newSettings = { workDuration, shortBreakDuration, longBreakDuration, cycles };
                            promptToSaveSettings(newSettings, startTimer); // Ask if user wants to save
                        });
                    });
                });
            });
        }
    });
}

/**
 * Starts the Pomodoro timer with the provided settings.
 * 
 * @param {Object} settings - The Pomodoro settings (durations and cycles) to start the timer with.
 */
function startTimer(settings) {
    const pomodoro = new PomodoroTimer(
        settings.workDuration,
        settings.shortBreakDuration,
        settings.longBreakDuration,
        settings.cycles,
        rl,  // Pass the readline interface to PomodoroTimer
        startPomodoroSetup // Callback to restart after stop
    );

    console.log('\nCustomizable Pomodoro Timer Setup Complete!\n');
    showCommandPrompt();
    rl.once('line', () => {
        pomodoro.start(); // Start the timer
        setupCommandListeners(pomodoro); // Attach command listeners after start
    });
}

/**
 * Sets up listeners for user commands during the Pomodoro timer session.
 * 
 * @param {PomodoroTimer} pomodoro - The current PomodoroTimer instance.
 */
function setupCommandListeners(pomodoro) {
    rl.removeAllListeners('line'); // Clear previous listeners
    rl.on('line', (input) => {
        const command = input.trim().toLowerCase();
        if (!command) return;
        switch (command) {
            case 'p':
                pomodoro.pause();
                break;
            case 'r':
                pomodoro.resume();
                break;
            case 's':
                pomodoro.stop();
                break;
            case 'x':
                pomodoro.reset();
                break;
            case 'stats':
                showStats(pomodoro);
                break;
            case 'history':
                fs.readFile('pomodoro_history.txt', 'utf8', (err, data) => {
                    if (err) {
                        console.log('No session history found.');
                    } else {
                        console.log('\n--- Pomodoro Session History ---');
                        console.log(data);
                    }
                });
                break;
            case 'help':
                showHelp();
                break;
            default:
                console.log('Unknown command. Type "help" to see all available commands.');
                showCommandPrompt();
        }
    });
}
// Start the initial setup for the Pomodoro timer
startPomodoroSetup();