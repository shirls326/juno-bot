import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

const data = new SlashCommandBuilder().setName('overwatch').setDescription('juno wants Overwatch');

async function execute(interaction: ChatInputCommandInteraction) {
    const overwatchRoleID = "1422600618702405692";
    await interaction.reply(`<@&${overwatchRoleID}> meow meow meow meow meow meow meow meow meow meow meow meow meow meow meow meow meow meow meow meow meow`);
}

export { data, execute };
