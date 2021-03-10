const Discord = require("discord.js");
const client = new Discord.Client();
const { prefix, token } = require("./config.json");

// Login message
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Rolls a dice.
function roll(defaultLog, message, args) {
    const MAX_DICE = 50;
    if (!args.length) {
        console.log(`${defaultLog} failed a roll (not enough arguments).`);
        return;
    } else {
        const dice = args[0].split("d");
        // Check if we have 'd'
        if (dice.length != 2) {
            console.log(`${defaultLog} failed a roll (invalid argument(s): ${args}).`);
            return;
        }
        // <c>d<s> - Ex: 1d20, c=1, s=20
        const dice_count = dice[0]; // c
        let half_two = dice[1].split('+');
        const dice_sides = half_two[0]; // s
        let additive = Number(half_two[1]);
        if (!isNaN(additive)) {
            add_str = ` + ${additive}`;
        } else {
            // no additive
            add_str = "";
            additive = 0;
        }

        // Check if there are too many dice.
        if (dice_count > MAX_DICE) {
            console.log(`${defaultLog} failed a roll (too many dice: ${dice_count} > ${MAX_DICE}).`);
            message.delete();
            message.reply(`too many dice! (max: ${MAX_DICE})`);
            return;
        }

        let roll_str = "";
        let total = 0;
        total += additive;
        for (i = 0; i < dice_count; i++) {
            const roll = Math.floor(Math.random() * dice_sides) + 1;
            total += roll;
            // add number
            if (roll == dice_sides || roll == 1) {
                roll_str += `**${roll}**`;
            }
            else {
                roll_str += `${roll}`;
            }

            // add commas
            if (i != dice_count - 1) {
                roll_str += ', ';
            }
        }

        console.log(`${defaultLog} rolled ${args[0]} -> ${roll_str}.`);

        message.delete();
        return message.channel.send(
            `${message.author}\n**Result**: ${dice_count}d${dice_sides} (${roll_str})${add_str}\n**Total**: ${total}`
        );
    }
}

// Gets the word of the day.
function word(defaultLog, message, args) {
    if (!args.length) {
        console.log(`${defaultLog} didn't specify a dictionary.`);
        return message.channel.send(
            `You didn't provide any arguments, ${message.author}!`
        );
    } else if (args[0] === "m" || args[0] === "d") {
        scrape_word(defaultLog, message, args[0]);
    }
    else {
        return message.channel.send(`You submitted an invalid dictionary, ${message.author}!`);
    }
}

function scrape_word(defaultLog, message, dictionary) {
    const fetch = require('node-fetch')
    const JSDOM = require('jsdom').JSDOM
    let url = "";
    let word_selector = "";
    let pronounce_selector = "";
    let word_type_selector = "";
    let definition_selector = "";
    let date_selector = "";

    if (dictionary === "m") {
        dictionary = "Merriam-Webster";
        url = "https://www.merriam-webster.com/word-of-the-day";
        word_selector = '.word-and-pronunciation > h1:nth-child(1)';
        pronounce_selector = '.word-syllables';
        word_type_selector = '.main-attr';
        definition_selector = '.wod-definition-container > p';
        date_selector = '.w-a-title';
    } else if (dictionary === "d") {
        dictionary = "Dictionary.com";
        url = "https://www.dictionary.com/e/word-of-the-day";
        word_selector = 'div.otd-item-wrapper:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > h1:nth-child(1)';
        pronounce_selector = 'div.otd-item-wrapper:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(4) > div:nth-child(1)';
        word_type_selector = 'div.otd-item-wrapper:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(5) > div:nth-child(1) > p:nth-child(1) > span:nth-child(1) > span:nth-child(1)';
        definition_selector = 'div.otd-item-wrapper:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(5) > div:nth-child(1) > p:nth-child(2)';
        date_selector = 'div.otd-item-wrapper:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1)';
    }

    fetch(url)
        .then(resp => resp.text())
        .then(text => {
            let dom = new JSDOM(text);
            let { document } = dom.window;
            let word = [...document.querySelectorAll(word_selector)]
                .map(a => a.textContent);
            let pronouncication = [...document.querySelectorAll(pronounce_selector)]
                .map(a => a.textContent);
            let word_type = [...document.querySelectorAll(word_type_selector)]
                .map(a => a.textContent);
            let definition = [...document.querySelectorAll(definition_selector)]
                .map(a => a.textContent);
            let date = [...document.querySelectorAll(date_selector)]
                .map(a => a.textContent);

            if (dictionary === "Merriam-Webster") {
                definition_str = "";
                for (i = 0; i < definition.length; i++) {
                    if (definition[i].includes("archaic")) {
                        definition_str += `${i + 1}.  *archaic* : ${definition[i].split(":")[1].split()}`;
                    } else {
                        definition_str += `${i + 1}. ${definition[i].split(":")[1].split()}`;
                    }
                    if (i != definition.length - 1) {
                        definition_str += "\n";
                    }
                }
                definition = definition_str;

                date = date[0].split(":")[1].trim();
            } else if (dictionary === "Dictionary.com") {
                pronouncication = pronouncication[0].trim();
                pronouncication = pronouncication.substring(2, pronouncication.length - 2);

                date = date[0].split(" ");
                date = `${date[1]} ${date[2]} ${date[3]}`;
            }

            message.delete()
                .then(message.channel.send(`**Word of the Day (${dictionary}) : ${date}**\n**${word}** (${word_type}) | ${pronouncication}\n${definition}\n<${url}>`))
                .then(console.log(`${defaultLog} fetched the word of the day (${word}) on ${dictionary}.`));
        });
}

// Commands
client.on("message", (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const defaultLog = `${message.author.username} ${message.author}`;

    if (command === "ping") {
        console.log(`${defaultLog} pinged.`);
        return message.reply("pong.");
    } else if (command === "pong") {
        console.log(`${defaultLog} ponged.`);
        return message.reply("ping.");
    } else if (command === "m") {
        return word(defaultLog, message, "m");
    } else if (command === "d") {
        return word(defaultLog, message, "d");
    } else if (command === "roll" || command === "r") {
        return roll(defaultLog, message, args);
    } else if (command === "asdf") {
        // hidden purge
        message.channel.bulkDelete(100);
    }
});

client.login(token);
