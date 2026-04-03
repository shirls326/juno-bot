import { Collection, SlashCommandBuilder } from 'discord.js';

declare module 'discord.js' {
  export interface Command {
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>
  }

  export interface MessageHandler {
    name: string;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>
  }

  export interface Event {
    name: string;
    once?: boolean;
    execute: (...input: any) => Promise<void>
  }

  export interface Client {
    commands: Collection<string, Command>;
    messageHandlers: Collection<string, any>;
  }
}

