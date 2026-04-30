import { ChatInputCommandInteraction, SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { Canvas, loadImage, Image } from '@napi-rs/canvas';
import getRandomSticker from '../../functions/get_sticker.ts';

const PADDING = 20;
const MIN_STICKER_SIZE = 150;
const MAX_STICKER_SIZE = 800;
const ATTACHMENT_MAX_BYTES = 8 * 1024 * 1024;
const MAX_DIMENSION = 1280;
const MIN_DIMENSION = 200;

const FRY_QUALITY_MIN = 0.85;
const FRY_QUALITY_MAX = 30;
const CLEAN_QUALITY = 90;

const SMALL_SCALE = 0.15;
const MEDIUM_SCALE = 0.3;
const LARGE_SCALE = 0.5;

const stickerCache = new Map<string, Image>();

const data = new SlashCommandBuilder()
  .setName('sticker')
  .setDescription('Add a cat themed sticker to your image!')
  .addAttachmentOption((option) =>
    option.setName('image').setDescription('Your background image.').setRequired(true)
  )
  .addNumberOption((option) =>
    option
      .setName('size')
      .setDescription('Sticker size')
      .addChoices(
        { name: 'Small', value: SMALL_SCALE },
        { name: 'Medium', value: MEDIUM_SCALE },
        { name: 'Large', value: LARGE_SCALE }
      )
  )
  .addIntegerOption((option) =>
    option.setName('fry').setDescription('Fry amount 0 - 100').setMinValue(0).setMaxValue(100)
  );

async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  try {
    const attachment = interaction.options.getAttachment('image', true);

    if (!attachment.contentType?.startsWith('image/')) {
      throw new Error('Provided file is not a valid image.');
    }

    const scaleFactor = interaction.options.getNumber('size') ?? MEDIUM_SCALE;
    const fryLevel = interaction.options.getInteger('fry') ?? 0;

    // Scale (0 - 100] to [QUALITY_MIN - QUALITY_MAX]
    // Max quality image if fry is 0
    const jpegQuality = Math.round(
      FRY_QUALITY_MAX - (fryLevel / 100) * (FRY_QUALITY_MAX - FRY_QUALITY_MIN)
    );
    const finalQuality =
      fryLevel === 0
        ? CLEAN_QUALITY
        : Math.max(FRY_QUALITY_MIN, Math.min(jpegQuality, FRY_QUALITY_MAX));

    const [background, sticker] = await Promise.all([
      loadImage(attachment.url),
      getRandomSticker().then(async (path) => {
        if (stickerCache.has(path)) return stickerCache.get(path)!;
        const img = await loadImage(path);
        stickerCache.set(path, img);
        return img;
      }),
    ]);

    if (background.width < MIN_DIMENSION || background.height < MIN_DIMENSION) {
      throw new Error(`Image is too small! Must be at least ${MIN_DIMENSION}px.`);
    }

    let { width, height } = background;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
      width *= ratio;
      height *= ratio;
    }

    const canvas = new Canvas(width, height);
    const context = canvas.getContext('2d');
    context.drawImage(background, 0, 0, width, height);

    // Dynamic sticker sizing
    const idealSize = Math.min(width, height) * scaleFactor;
    let stickerSize = Math.max(MIN_STICKER_SIZE, idealSize);
    stickerSize = Math.min(stickerSize, MAX_STICKER_SIZE, width, height);

    const stickerX = Math.max(0, width - stickerSize - PADDING);
    const stickerY = Math.max(0, height - stickerSize - PADDING);

    context.drawImage(sticker, stickerX, stickerY, stickerSize, stickerSize);

    const buffer = await canvas.encode('jpeg', finalQuality);

    if (buffer.length > ATTACHMENT_MAX_BYTES) {
      throw new Error('Resulting file too large');
    }

    const attachmentFile = new AttachmentBuilder(buffer, { name: 'sticker-image.jpg' });

    await interaction.editReply({ files: [attachmentFile] });
  } catch (error) {
    console.error(error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to process the image.';
    const finalMsg =
      errorMessage === 'Resulting file too large'
        ? 'The processed image was too large for Discord. Try a different fry level or smaller image.'
        : errorMessage;

    try {
      await interaction.editReply({ content: finalMsg });
    } catch (replyError) {
      console.error('Could not send error reply:', replyError);
    }
  }
}

export { data, execute };
