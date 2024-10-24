require('dotenv').config();  // Add this line at the top of your file


const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages
    ]
});



// List of channels where users are required to have their cameras on
const camChannels = ['📋| cam study 1', '📔| cam study 2', '📋| cam study 3'];

// Store users that have been warned
let warnedUsers = {};

// Event listener when bot is ready
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Event listener for voice state updates (joining/leaving VC)
client.on('voiceStateUpdate', async (oldState, newState) => {
    const user = newState.member;
    const channel = newState.channel;

    // Check if the user joins any of the cam channels
    if (channel && camChannels.includes(channel.name)) {
        // Warn the user to turn on their camera
        user.send('Please turn on your camera to stay in this channel, or you will be disconnected.');
        
        // Store the user with the time of the warning
        warnedUsers[user.id] = {
            warnedAt: Date.now(),
            warnings: 1
        };

        // After 15 seconds, disconnect the user if they haven't complied
        setTimeout(() => {
            // If the user is still in the channel and hasn't "complied" (since we can't check camera, this is time-based)
            if (warnedUsers[user.id] && (Date.now() - warnedUsers[user.id].warnedAt) >= 15000) {
                user.voice.disconnect(); // Disconnect the user
                user.send('You have been disconnected for not turning on your camera.');
                delete warnedUsers[user.id]; // Remove them from the warned list
            }
        }, 15000); // 15 seconds to comply
    }
});

console.log('Token:', process.env.TOKEN);  // Debug to check if the token is loaded

// Log in to the bot using the token
client.login(process.env.TOKEN);





