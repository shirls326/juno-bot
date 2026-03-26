module.exports = {
    name: 'greet',
    async execute(message) {
        if (message.author.bot) return;

        if (message.content.toLowerCase().includes('meow')) {
            await message.channel.send(`${message.author}, meow!`);
        }
    },
};