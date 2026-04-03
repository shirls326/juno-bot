import { ApplicationCommand, REST, Routes } from 'discord.js';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { config } from 'dotenv';

import { __dirname, getExportsFromModule } from './utils/filesystem.ts';

// Configure dotenv
config({ quiet: true });

// Grab all the command folders from the commands directory
const commands = [];
const foldersPath = join(__dirname, 'commands');
const commandFolders = readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = join(foldersPath, folder);
	const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith('.ts') && !file.startsWith('_'));

	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = join(commandsPath, file);
		const command = await getExportsFromModule(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module
const token = process.env['DISCORD_BOT_TOKEN'] ?? '';
const clientId = process.env['DISCORD_CLIENT_ID'] ?? '';
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in ALL guilds
		const data = await rest.put(Routes.applicationCommands(clientId), { body: commands }) as ApplicationCommand[];

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();
