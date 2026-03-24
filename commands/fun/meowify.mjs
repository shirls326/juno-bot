import { SlashCommandBuilder } from 'discord.js';

const NO_MEOW_SUBSTRINGS = ["time", "some", "sum", "ome", "mer"];

function meowify(input) {
    if (!input) return "What the meow? (Please tell me more)";

    const processed = input.replace(/\w+/g, (word) => {
        const lowerWord = word.toLowerCase();

        for (const sub of NO_MEOW_SUBSTRINGS) {
            if (lowerWord.includes(sub)) return word;
        }

        const base = word.replace(/s+$/i, "");
        if (base.length <= 5) return word;

        const lower = base.toLowerCase();
        const validMatches = [];

        for (let i = 0; i < base.length - 1; i++) {
            const pair = lower.slice(i, i + 2);
            if (pair === "me" || pair === "mi" || pair === "my") {
                if (i > base.length - 3) continue;
                validMatches.push(i);
            }
        }

        if (validMatches.length === 1) {
            const i = validMatches[0];
            // Preserve original casing of the start/end of the word
            return word.slice(0, i) + "MEOW" + word.slice(i + 2);
        }

        return word;
    });

    // Discord API Safety: Limit to 2000 chars
    return processed.length > 2000 ? processed.slice(0, 1997) + "..." : processed;
}

 const data = new SlashCommandBuilder()
                .setName('meowify')
                .setDescription('Translate your words into cat speak.')
                .addStringOption(option => option.setName('text').setDescription('Text to meowify').setRequired(true)
);

async function execute(interaction) {
    const input = interaction.options.getString('text');
    const response = meowify(input);

    if (response === input) { // No changes
        await interaction.reply(`*Walks away...*`);
    } else {
        await interaction.reply(response);
    }
}

export { data, execute };