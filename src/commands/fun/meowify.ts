import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { meowify } from '../../functions/meowify.ts';

const data = new SlashCommandBuilder()
    .setName('meowify')
    .setDescription('Translate your words into cat speak.')
    .addStringOption(option => option.setName('text').setDescription('Text to meowify').setRequired(true)
    );

async function execute(interaction: ChatInputCommandInteraction) {
    const input = interaction.options.getString('text') ?? '';
    const response = meowify(input);

    if (response === input) { // No changes
        await interaction.reply(`*Walks away...*`);
    } else {
        await interaction.reply(response);
    }
}

export { data, execute };
