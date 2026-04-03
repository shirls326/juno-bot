import { ChatInputCommandInteraction, Collection, SlashCommandBuilder } from 'discord.js';

const data = new SlashCommandBuilder().setName('randomping').setDescription('ping a random user in the server');

// pings a random online user in the server
async function execute(interaction: ChatInputCommandInteraction) {
    // First use guild.members.fetch to make sure all members are cached
    const fetchedMembers = await interaction.guild?.members.fetch({ withPresences: true }) ?? new Collection();

    // Filter the members to get only non-bots that are who are online
    // N.B: Offline members have member.presence?.status === undefined
    const onlineMembers = fetchedMembers
        .filter(member => !member.user.bot && member.presence?.status)
        .mapValues(member => member.user);

    // pick a random member out of the total online members
    const randomOnlineMemberId = onlineMembers.randomKey();

    // const randomOnlineMemberId = onlineMembers.random().user;
    console.log(onlineMembers);

    // quiet ping a random user
    //await interaction.reply(`<@${randomOnlineMemberId}> meow`, { allowedMentions: { parse: [] } });
    await interaction.reply(`<@${randomOnlineMemberId}> meow`);
}

export { data, execute };
