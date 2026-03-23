import { SlashCommandBuilder } from 'discord.js';

const data = new SlashCommandBuilder().setName('overwatch').setDescription('juno wants Overwatch');
const roleID = "1422600618702405692";

async function execute(interaction) {
    await interaction.reply(`<@&${roleID}> meow meow meow meow meow meow meow meow meow meow meow meow meow meow meow meow meow meow meow meow meow`);
}

export { data, execute };