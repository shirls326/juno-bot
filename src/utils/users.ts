import { ChatInputCommandInteraction, Collection, User } from 'discord.js';

export async function getAllGuildMembers(interaction: ChatInputCommandInteraction) {
  return (await interaction.guild?.members.fetch({ withPresences: true })) ?? new Collection();
}

export async function getAllUsers(interaction: ChatInputCommandInteraction) {
  const guildMembers = await getAllGuildMembers(interaction);
  return guildMembers.mapValues((member) => member.user);
}

export async function getOnlineUsers(
  interaction: ChatInputCommandInteraction,
  includeBots = false
): Promise<Collection<string, User>> {
  const guildMembers = await getAllGuildMembers(interaction);

  // N.B: Offline members have member.presence?.status === undefined
  return guildMembers
    .filter((member) => member.user.bot === includeBots && member.presence?.status)
    .mapValues((member) => member.user);
}
