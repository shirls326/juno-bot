import { ChatInputCommandInteraction, SlashCommandBuilder, AttachmentBuilder } from 'discord.js';

import { Canvas, loadImage } from '@napi-rs/canvas';

import getRandomSticker from '../../functions/get_sticker.ts';

const SCALE_FACTOR = 0.3; // % of the smaller dimension of the background image
const PADDING = 20; // pixels of padding from the edges of the background image
const MIN_STICKER_SIZE = 150; // minimum sticker size in pixels
const MAX_STICKER_SIZE = 512; // maximum sticker size in pixels

const data = new SlashCommandBuilder()
  .setName('sticker')
  .setDescription('Add a cat themed sticker to your image!')
  .addAttachmentOption(option =>
    option.setName('image')
      .setDescription('Your background image.')
      .setRequired(true)
  );

async function execute(interaction: ChatInputCommandInteraction) {
  const background = await loadImage(interaction.options.getAttachment('image', true).url);

  const canvas = new Canvas(background.width, background.height);
  const context = canvas.getContext('2d');

  context.drawImage(background, 0, 0, canvas.width, canvas.height);

  const stickerPath = await getRandomSticker();
  const sticker = await loadImage(stickerPath);

  const idealSize = Math.min(canvas.width, canvas.height) * SCALE_FACTOR;

  let stickerSize = Math.max(MIN_STICKER_SIZE, idealSize); 
  stickerSize = Math.min(stickerSize, MAX_STICKER_SIZE, canvas.width, canvas.height);

  const stickerX = canvas.width - stickerSize - PADDING;
  const stickerY = canvas.height - stickerSize - PADDING;

  context.drawImage(sticker, stickerX, stickerY, stickerSize, stickerSize);
  
  const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'sticker-image.png' });
  await interaction.reply({ files: [attachment] });
}

export { data, execute };
