
const { Client } = require('whatsapp-web.js');
const fs = require('fs');
const qrcode = require('qrcode-terminal');

// Phone number (your bot's number) and session file path
const phoneNumber = '01839268235'; // Change this to your bot number
const sessionFilePath = `./sessions/${phoneNumber}.json`;

// Initialize client
const client = new Client();

// Check if session file exists
if (fs.existsSync(sessionFilePath)) {
    const sessionData = require(sessionFilePath);
    client.initialize({ session: sessionData });
} else {
    client.initialize();
}

// Event when QR code is generated
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan this QR code to log in');
});

// Event when the bot is ready
client.on('ready', () => {
    console.log('Bot is ready!');
});

// Event when the session is authenticated
client.on('authenticated', (session) => {
    fs.writeFileSync(sessionFilePath, JSON.stringify(session));
    console.log('Session saved!');
});
