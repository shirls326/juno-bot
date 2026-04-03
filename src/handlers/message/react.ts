import type { Message } from "discord.js";

const name = 'react';

async function execute(message: Message) {
    const junoEmojiId = '1450675679128457307';
    const talkToJunoChannel1Id = '1485752622857326692';
    const talkToJunoChannel2Id = '1486081968243474587';

    if (message.author.bot) return;
    if (message.channel.id !== talkToJunoChannel1Id && message.channel.id !== talkToJunoChannel2Id) return;

    await message.react(junoEmojiId);
}

export { name, execute };
