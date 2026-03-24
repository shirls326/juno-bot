import { SlashCommandBuilder } from 'discord.js';

const data = new SlashCommandBuilder().setName('dailychallenge').setDescription('gives the daily challenge information');

// daily challenge will be 

async function execute(interaction) {
    await interaction.reply(meows[Math.round(Math.random()*meows.length)]);
}

export { data, execute }; 