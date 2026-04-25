import type { Message } from 'discord.js';
import { meowify } from '../../functions/meowify.ts';

const name = 'meowify';

const COOLDOWN_MESSAGES = 1;
const messagesSinceMeowify = new Map<string, number>();
const visibleCategories = new Set<string>([
  '1486081820411039825', // juno bot dev
  '1437592460950896680', // games
  '1440177563166314497', // hobbies
]);
async function execute(message: Message) {
  if (message.author.bot || !('send' in message.channel)) {
    return;
  }

  // Ignore restricted categories
  if ('parentId' in message.channel && message.channel.parentId) {
    if (!visibleCategories.has(message.channel.parentId)) {
      return;
    }
  }

  const channelId = message.channelId;
  const count = messagesSinceMeowify.get(channelId) ?? COOLDOWN_MESSAGES;

  if (count < COOLDOWN_MESSAGES) {
    messagesSinceMeowify.set(channelId, count + 1);
    return;
  }

  const result = meowify(message.content);

  // Send meowify if message was modified.
  if (result !== message.content) {
    messagesSinceMeowify.set(channelId, 0);
    await message.channel.send(result);
  }
}

export { name, execute };
