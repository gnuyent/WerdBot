const Discord = require("discord.js");
const client = new Discord.Client();
const { prefix, token, mwkey } = require("./config.json");


// Login message
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!\n`);
});

// Commands
const roll = require('./commands/roll');
const word = require('./commands/word');

client.on("message", (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const currentTime = new Date();
    const defaultLog = `[${currentTime.toLocaleString()}] ${message.author.username} ${message.author}`;

    if (command === "ping") {
        console.log(`${defaultLog} pinged.`);
        return message.reply("pong.");
    } else if (command === "pong") {
        console.log(`${defaultLog} ponged.`);
        return message.reply("ping.");
    } else if (command === "m" || command === "d") {
        return word.word(defaultLog, message, mwkey, command, args);
    } else if (command === "roll" || command === "r") {
        return roll.roll(defaultLog, message, args);
    } else if (command === "delete") {
        // hidden purge
        message.channel.bulkDelete(2)
            .then(console.log(`${defaultLog} deleted the last message.`));
    } else {
        message.delete()
            .then(console.log(`${defaultLog} deleted unknown command ${message.content}.`));
    }
});

client.login(token);
