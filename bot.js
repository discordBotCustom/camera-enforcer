require('dotenv').config();  // Load .env

const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages
    ]
});

// List of cam channels where users are expected to turn on their cameras
const camChannels = ['📋| cam study 1', '📔| cam study 2', '📋| cam study 3'];

// Store users that have been warned
let warnedUsers = {};

// Event listener when bot is ready
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Function to disconnect a user
async function disconnectUser(user) {
    await user.voice.disconnect();
    await user.send('You have been disconnected for not turning on your camera.');
    delete warnedUsers[user.id];
}

// Event listener for voice state updates (joining/leaving VC)
client.on('voiceStateUpdate', async (oldState, newState) => {
    const user = newState.member;
    const newChannel = newState.channel; // New channel user joined
    const oldChannel = oldState.channel; // Previous channel user left

    // If the user joins a cam channel
    if (newChannel && camChannels.includes(newChannel.name)) {
        // Check if the camera is on
        if (newState.selfVideo) {
            user.send(`Thank you for joining ${newChannel.name} with your camera on!`);
        } else {
            // Send warning message
            user.send(`Please turn on your camera to stay in ${newChannel.name}.`);

            // Store the user with the time of the warning
            warnedUsers[user.id] = {
                warnedAt: Date.now(),
                channel: newChannel.id,
                compliant: false // Assume non-compliance at first
            };

            // Check for compliance after 15 seconds
            setTimeout(() => {
                const warnedUser = warnedUsers[user.id];
                // If the user is still in the cam channel and hasn't complied
                if (warnedUser && newState.channel && newState.channel.id === warnedUser.channel && !warnedUser.compliant && !newState.selfVideo) {
                    disconnectUser(user);
                }
            }, 15000); // 15 seconds to comply
        }
    }

    // If the user leaves the cam channel or switches to a non-cam channel
    if (oldChannel && camChannels.includes(oldChannel.name)) {
        // If they switch to a non-cam channel, we don't disconnect them
        if (newChannel && !camChannels.includes(newChannel.name)) {
            // User switched to a non-cam channel
            if (warnedUsers[user.id]) {
                warnedUsers[user.id].compliant = true; // Mark as compliant
            }
            user.send(`You have switched to ${newChannel.name}, no camera required here.`);
            delete warnedUsers[user.id]; // Stop tracking them
        } else if (!newChannel) {
            delete warnedUsers[user.id]; // Stop tracking them
        }
    }

    // If the user is still in a cam channel and has turned on their camera (compliance)
    if (newChannel && camChannels.includes(newChannel.name) && warnedUsers[user.id]) {
        const warnedUser = warnedUsers[user.id];
        if (newState.selfVideo) {
            // Mark user as compliant if they turn on their camera
            warnedUser.compliant = true;
            user.send('Thank you for turning on your camera!');
            delete warnedUsers[user.id]; // No need to monitor further
        }
    }
});

// Log in to the bot using the token
client.login(process.env.TOKEN);



