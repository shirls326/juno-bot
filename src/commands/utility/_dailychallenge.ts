import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

const data = new SlashCommandBuilder().setName('dailychallenge').setDescription('gives the daily challenge information');

// daily challenge will be 

async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply('jon');
}

export { data, execute }; 
