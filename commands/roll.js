
// Rolls a dice.
function roll(defaultLog, message, args) {
    const MAX_DICE = 50;
    if (!args.length) {
        console.log(`${defaultLog} failed a roll (not enough arguments).`);
        return;
    } else {
        const dice = args[0].split("d");
        // Check if we have 'd'/proper num arguments
        if (dice.length != 2) {
            console.log(`${defaultLog} failed a roll (invalid argument(s): ${args}).`);
            return;
        }
        // <c>d<s> - Ex: 1d20, c=1, s=20
        const dice_count = dice[0]; // c
        let half_two = dice[1].split('+');
        const dice_sides = half_two[0]; // s
        let additive = Number(half_two[1]);
        // check if additive exists
        if (!isNaN(additive)) {
            add_str = ` + ${additive}`;
        } else {
            // no additive to roll
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
            // 1 to max inclusive
            const roll = Math.floor(Math.random() * dice_sides) + 1;
            total += roll;
            // bold if max or 1
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

module.exports = {roll};
