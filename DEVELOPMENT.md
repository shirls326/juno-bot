## Development

### Prerequisites
* Node v24.x.x+

### One-time Setup
1. Go to https://discord.com/developers/applications and create a new app. This will be your personal discord bot for testing.
2. Copy the template in `.env.example`, to a new `.env` file at the project root and fill out the fields using your bot's details. `DISCORD_BOT_TOKEN` and `DISCORD_CLIENT_ID` are the most important fields.
3. Build your bot locally. To do so, run the following series of commands without any other changes:
```
npm install
npm run build
npm run deploy-commands
npm start
```
4. Invite your bot to the server and test that it works by running a basic `/meow` command. Make sure that `npm start` is still running while you do this.

### Development Process
1. Fork this repo and checkout a new feature branch
2. Make your proposed changes. Use this [discordjs documentation](https://discord.js.org/docs/packages/discord.js/14.25.1) and try to follow patterns followed in other files as well as good coding practices (SOLID, KISS, YAGNI, etc.). AI use is permitted as long as the code quality is there
3. Test your changes thoroughly using your personal discord bot
4. In your feature branch, commit your changes
5. Open a PR on [GitHub](https://github.com/shirls326/juno-bot/pulls) and include a brief description of your change and its purpose

### Testing New Commands
1. Run the following npm script:
```
npm run deploy-commands
```
2. Refresh discord (Ctrl+r) and test
