const readline = require('readline');
const PomodoroTimer = require('./src/timer');

// Keep a persistent readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function showCommandPrompt() {
    console.log('Enter "p" to pause, "r" to resume, "s" to stop, or "x" to reset. Type "help" to see all commands.');
}

function showHelp() {
    console.log(`
Available Commands:
- "p": Pause the current session.
- "r": Resume the paused session.
- "s": Stop the current session and restart.
- "x": Reset the timer to the original settings.
- "help": Display this help message.
    `);
}

function startPomodoroSetup() {
    console.log('\nWelcome to the Pomodoro Timer setup!');
    
    // First input: work duration
    rl.question('Enter work duration in minutes (default is 25): ', (workInput) => {
        const workDuration = parseInt(workInput) * 60 || 25 * 60;

        // Second input: short break duration
        rl.question('Enter short break duration in minutes (default is 5): ', (shortBreakInput) => {
            const shortBreakDuration = parseInt(shortBreakInput) * 60 || 5 * 60;

            // Third input: long break duration
            rl.question('Enter long break duration in minutes (default is 15): ', (longBreakInput) => {
                const longBreakDuration = parseInt(longBreakInput) * 60 || 15 * 60;

                // Fourth input: cycles
                rl.question('Enter number of cycles before a long break (default is 4): ', (cyclesInput) => {
                    const cycles = parseInt(cyclesInput) || 4;

                    const pomodoro = new PomodoroTimer(
                        workDuration,
                        shortBreakDuration,
                        longBreakDuration,
                        cycles,
                        rl,  // Pass the readline interface to PomodoroTimer
                        startPomodoroSetup // Callback to restart after stop
                    );

                    console.log('\nCustomizable Pomodoro Timer Setup Complete!\n');
                    showCommandPrompt();
                    console.log('Press "Enter" to start your first work session.');

                    rl.removeAllListeners('line'); // Ensure no duplicate listeners
                    rl.once('line', () => {
                        pomodoro.start(); // Start the timer
                        setupCommandListeners(pomodoro); // Attach command listeners after start
                    });
                });
            });
        });
    });
}

function setupCommandListeners(pomodoro) {
    // Clear any previous listeners
    rl.removeAllListeners('line');
    
    rl.on('line', (input) => {
        const command = input.trim().toLowerCase();
        if (!command){
            return; //if there is no command input do nothing to avoid triggering the 'unknown command' log
        }
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