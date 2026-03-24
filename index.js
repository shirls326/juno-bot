const { readdirSync } = require('node:fs');
const { join } = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');

// Configure dotenv
require('dotenv').config({ quiet: true });

const clientOptions = {
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	],
	allowedMentions: {
		parse: ['users', 'roles', 'everyone']
	}
};

// Create a new client instance
const client = new Client(clientOptions);

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on('messageCreate', async (message) => {
  // 1. Ignore messages from bots (prevents infinite loops)
  if (message.author.bot) return;

  // 2. Filter by specific channel
  if (message.channel.id !== '1485752622857326692' && message.channel.id !== '1486081968243474587') return;
	console.log(`Received message: ${message.content}`);
  try {
    // 3. React! 
    // Standard emoji: '✅'
    // Custom emoji ID: '123456789012345678'
    await message.react('1450675679128457307'); 
  } catch (error) {
    console.error('Failed to react:', error);
  }
});


// Log in to Discord with your client's token
const token = process.env.DISCORD_JUNO_TOKEN;
client.login(token);
client.commands = new Collection();

const foldersPath = join(__dirname, 'commands');
const commandFolders = readdirSync(foldersPath);
for (const folder of commandFolders) {
	const commandsPath = join(foldersPath, folder);
	const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith('.mjs') && !file.startsWith('_'));
	for (const file of commandFiles) {
		const filePath = join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// listens for the command when it's requested on discord
client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	// console.log(interaction);
	const command = interaction.client.commands.get(interaction.commandName);
	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: 'There was an error while executing this command!',
				flags: MessageFlags.Ephemeral,
			});
		} else {
			await interaction.reply({
				content: 'There was an error while executing this command!',
				flags: MessageFlags.Ephemeral,
			});
		}
	}
});


