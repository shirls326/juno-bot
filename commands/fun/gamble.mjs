import { SlashCommandBuilder } from 'discord.js';

const data = new SlashCommandBuilder().setName('gamble').setDescription('gamble on getting 42069, if u get it u win');

// tryiung to make a bot that generates a random number from 0 - 42069 and if you get 42069 you win  

// console.log(gamble);
//let response = '';

// console.log(response);
async function execute(interaction) {
    let response = ' ';
    let gamble = Math.round(Math.random()*42069 + 1); // generates a random number from 1 to 42069 (inclusive)
    
    if (gamble == 42069) {
        response = 'Congratulations! You won the gamble! You got 42069!';
    } else {
        response = 'u got ' + gamble + '. better luck next time!';
    }
    // console.log("this is the response: " + response + " and this is the gamble: " + gamble); 

    await interaction.reply(response);
}

export { data, execute };