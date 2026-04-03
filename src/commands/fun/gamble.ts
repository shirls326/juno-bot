import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

const data = new SlashCommandBuilder().setName('gamble').setDescription('gamble on getting 42069, if u get it u win');

async function execute(interaction: ChatInputCommandInteraction) {
    let response;
    const gamble = Math.round(Math.random() * 42069 + 1); // generates a random number from 1 to 42069 (inclusive)

    if (gamble == 42069) {
        response = 'Congratulations! You won the gamble! You got 42069!';
    } else {
        response = 'u got ' + gamble + '. better luck next time!';
    }

    await interaction.reply(response);
}

export { data, execute };
