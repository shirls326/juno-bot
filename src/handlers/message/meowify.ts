import type { Message } from "discord.js";
import { meowify } from "../../functions/meowify.ts";

const name = 'meowify';

async function execute(message: Message) {
    if (message.author.bot || !('send' in message.channel)) {
        return;
    }

    const result = meowify(message.content);

    if (result !== message.content) {
        await message.channel.send(result);
    }
}

export { name, execute };
