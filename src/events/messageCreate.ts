import { Events, Message } from 'discord.js';

const name = Events.MessageCreate;

async function execute(message: Message) {
    if (message.author.bot) return;

    const handlers = message.client.messageHandlers;

    handlers.forEach(async (handler) => {
        try {
            await handler.execute(message);
        } catch (error) {
            console.error(`Error in handler ${handler.name}:`, error);
        }
    });
}

export { name, execute };
