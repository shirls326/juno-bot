## Development

### One-time Setup
1. Ask a project owner for their .env file. Use the template in `.env.example` to create yours at the same level.
2. Install dependencies
```
npm install
```

### Publishing New Commands
1. Create a new file for your command under `commands/{some folder name}/{your command name}.mjs`
2. Write code for your new command, following [discordjs documentation](https://discord.js.org/docs/packages/discord.js/14.25.1) and patterns in other files
3. Commit your changes and open a PR for them

### Deploying New Commands (Project Owners Only)
1. On the hosting machine, run the following npm script:
```
npm run deploy-commands
```
2. Refresh discord (Ctrl+r) and test
