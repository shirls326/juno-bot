import { Client, Events } from 'discord.js';

const name = Events.ClientReady;

const once = true;

function execute(client: Client) {
	const user = client?.user?.tag ?? 'unknown user';
	console.log(`Ready! Logged in as ${user}`);
}

export { name, once, execute };
