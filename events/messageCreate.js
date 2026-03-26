const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        const handlers = message.client.messageHandlers;

        handlers.forEach(async (handler) => {
            try {
                await handler.execute(message);
            } catch (error) {
                console.error(`Error in handler ${handler.name}:`, error);
            }
        });
    },
};