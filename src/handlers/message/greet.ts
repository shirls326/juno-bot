import type { Message } from "discord.js";

const name = 'greet';

async function execute(message: Message) {
    if (message.author.bot) return;

    if (message.content.toLowerCase().includes('meow') && 'send' in message.channel) {
        await message.channel.send(`${message.author}, meow!`);
    }
}


export { name, execute };

