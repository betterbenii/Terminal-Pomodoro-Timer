

Pomodoro Timer App

This is a customizable Pomodoro Timer built with Node.js that allows users to track their work and break sessions, save custom settings for future use, and review past session histories.

Features:

Customizable Timer: Set your work, short break, and long break durations, and the number of cycles before a long break.

Save & Load Settings: Option to save custom settings for later use, with unique IDs for each saved session.

Session History: Track your work and break sessions, and view detailed history logs.

Statistics: View total work time, total break time, and the number of completed Pomodoro sessions.

Pause/Resume/Stop/Reset: Control the timer with simple commands.



---

File Structure

.
├── src/
│   └── timer.js       # Main Pomodoro timer logic
├── settings.json      # File to store saved custom settings
├── pomodoro_history.txt # File to store session history
├── index.js           # Main entry point of the app
└── README.md          # Project documentation (this file)
|__sounds/
     |___bell.mp3


src/timer.js: Contains the core Pomodoro Timer class, including countdown logic, notification handling, and session tracking.

settings.json: Stores saved Pomodoro timer settings. Each set of saved settings has a unique ID.

pomodoro_history.txt: Contains a log of all work and break sessions, including total work time, total break time, and the number of completed Pomodoro sessions.

index.js: Entry point of the application. Manages user input, saving/loading settings, and overall application flow.

sounds/bell.mp3 : Contains the notification sound.


---

How to Run the App

Prerequisites

Node.js: Ensure that Node.js is installed on your system. 


Steps

1. Clone the repository:

git clone <repository-url>
cd pomodoro-timer


2. Install dependencies:

npm install


3. Run the application:

node index.js




---

Usage

1. Customizing Settings: When prompted, you can enter the duration for work sessions, short breaks, long breaks, and the number of cycles before a long break.


2. Saving Settings: After entering your settings, you'll be asked whether you'd like to save them for future use. If you choose to save them, you'll be able to load them in future sessions.


3. Commands During the Timer:

p: Pause the timer

r: Resume the timer

s: Stop the timer and restart

x: Reset the timer to the original settings

history: View the session history

stats: View your Pomodoro statistics (total work/break time and completed sessions)

help: Display available commands



4. Loading Saved Settings: If you have saved settings, the application will ask if you'd like to load one of the saved sessions. You can select one by its unique ID.




---

License

This project is open-source and available under the MIT License.

