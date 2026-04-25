import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { getOnlineUsers } from '../../utils/users.ts';

const data = new SlashCommandBuilder()
  .setName('randomping')
  .setDescription('ping a random online user in the server');

async function execute(interaction: ChatInputCommandInteraction) {
  const onlineUsers = await getOnlineUsers(interaction);

  // pick a random member out of the total online members
  const randomOnlineMemberId = onlineUsers.randomKey();

  // "quiet ping" a random user; they will not receive notifications
  await interaction.reply({
    content: `<@${randomOnlineMemberId}> meow`,
    flags: MessageFlags.SuppressNotifications,
  });
}

export { data, execute };
