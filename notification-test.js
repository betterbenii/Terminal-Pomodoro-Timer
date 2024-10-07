const notifier = require('node-notifier');

// Send a test notification
notifier.notify({
    title: 'Test Notification',
    message: 'This is a test notification from Node.js!',
    sound: true,  // You can also play a system notification sound
    wait: false   // No need to wait for user interaction
});