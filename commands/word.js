// Gets the word of the day.
function word(defaultLog, message, mwkey, dictionary, args) {
    if (args.length >= 1 && dictionary === "m") {
        scrape_word(defaultLog, message, mwkey, args.join(" "));
    } else if (args.length === 0 && (dictionary === "m" || dictionary === "d")) {
        scrape_wotd(defaultLog, message, dictionary);
    } else {
        message.reply(`wrong dictionary!`)
            .then(console.log(`${defaultLog} used the wrong dictionary.`));
    }
}

function clean(url) {
    return url.replace(" ", "%20").replace("'", "%27");
}
function scrape_word(defaultLog, message, mwkey, word) {
    const fetch = require('node-fetch')
    const JSDOM = require('jsdom').JSDOM
    let url = clean(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${mwkey}`);
    let clean_url = clean(`https://www.merriam-webster.com/dictionary/${word}`);

    fetch(url)
        .then(resp => resp.text())
        .then(text => {
            const json = JSON.parse(text);
            const word = json[0]["meta"]["id"];
            const pronunciation = json[0]["hwi"]["prs"][0]["mw"];
            const wordType = json[0]["fl"];
            const definition = json[0]["shortdef"][0];
            message.delete()
                .then(message.channel.send(`**Merriam-Webster**\n**${word}** (${wordType}) | ${pronunciation}\n${definition}\n<${clean_url}>`))
                .then(console.log(`${defaultLog} fetched the word (${word}) on Merriam-Webster.`));
        });
}

function scrape_wotd(defaultLog, message, dictionary) {
    const fetch = require('node-fetch')
    const JSDOM = require('jsdom').JSDOM
    let url = "";
    let word_selector = "";
    let pronounce_selector = "";
    let word_type_selector = "";
    let definition_selector = "";
    let date_selector = "";

    // CSS Selectors
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
                // don't number if only one definition
                if (definition.length == 1) {
                    // check if archaic
                    if (definition[0].includes("archaic")) {
                        definition_str += `*archaic* : ${definition[0].split(":")[1].split()}`;
                    } else {
                        definition_str += `${definition[0].split(":")[1].split()}`;
                    }
                }

                // number if > 1 definition
                for (i = 0; i < definition.length; i++) {
                    // check if archaic
                    if (definition[i].includes("archaic")) {
                        definition_str += `${i + 1}.  *archaic* : ${definition[i].split(":")[1].split()}`;
                    } else {
                        definition_str += `${i + 1}. ${definition[i].split(":")[1].split()}`;
                    }
                    // add newline unless last definition
                    if (i != definition.length - 1) {
                        definition_str += "\n";
                    }
                }
                definition = definition_str;

                date = date[0].split(":")[1].trim();
            } else if (dictionary === "Dictionary.com") {
                pronouncication = pronouncication[0].trim();
                // remove brackets
                pronouncication = pronouncication.substring(2, pronouncication.length - 2);

                date = date[0].split(" ");
                date = `${date[1]} ${date[2]} ${date[3]}`;
            }

            message.delete()
                .then(message.channel.send(`**Word of the Day (${dictionary}) : ${date}**\n**${word}** (${word_type}) | ${pronouncication}\n${definition}\n<${url}>`))
                .then(console.log(`${defaultLog} fetched the word of the day (${word}) on ${dictionary}.`));
        });
}

module.exports = { word };
