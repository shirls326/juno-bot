import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import pkg from '@tonejs/midi';
const { Midi } = pkg;
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLES_DIR = join(__dirname, '..', '..', 'assets', 'samples');

const SAMPLE_RATE = 44100;
const MAX_DURATION_SEC = 30;
const MAX_NOTES = 2000;

function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

const SAMPLES_RATE = 48000;

const SAMPLE_FILES = [
    { file: 'Cat_idle2.wav',       baseFreq: 489.80 },
    { file: 'Cat_idle3.wav',       baseFreq: 533.33 },
    { file: 'Cat_idle4.wav',       baseFreq: 607.59 },
    { file: 'Stray_cat_idle1.wav', baseFreq: 539.33 },
    { file: 'Stray_cat_idle2.wav', baseFreq: 657.53 },
    { file: 'Stray_cat_idle4.wav', baseFreq: 676.06 },
];

/** Parse a 16-bit mono PCM WAV Buffer into a Float32Array. */
function parseWav(buf) {
    // Walk chunks to find data
    let dataOffset = -1, dataSize = -1, i = 12;
    while (i < buf.length - 8) {
        const id = buf.toString('ascii', i, i + 4), size = buf.readUInt32LE(i + 4);
        if (id === 'data') { dataOffset = i + 8; dataSize = size; break; }
        i += 8 + size;
    }
    const totalSamples = dataSize / 2; // 16-bit = 2 bytes per sample
    const mono = new Float32Array(totalSamples);
    for (let s = 0; s < totalSamples; s++)
        mono[s] = buf.readInt16LE(dataOffset + s * 2) / 32768;
    return mono;
}

/** Resample and pitch-shift a sample to a target frequency using linear interpolation. */
function pitchShift(samples, srcRate, targetFreq, baseFreq) {
    // Combined rate-conversion + pitch-shift into one pass
    const playbackRate = (targetFreq / baseFreq) * (srcRate / SAMPLE_RATE);
    const outputLength = Math.floor(samples.length / playbackRate);
    const out = new Float32Array(outputLength);
    for (let i = 0; i < outputLength; i++) {
        const pos = i * playbackRate;
        const lo = Math.floor(pos);
        const hi = Math.min(lo + 1, samples.length - 1);
        out[i] = samples[lo] + (pos - lo) * (samples[hi] - samples[lo]);
    }
    return out;
}

function encodeWav(floatBuffer) {
    const dataSize = floatBuffer.length * 2;
    const wav = Buffer.alloc(44 + dataSize);

    wav.write('RIFF', 0, 'ascii');
    wav.writeUInt32LE(36 + dataSize, 4);
    wav.write('WAVE', 8, 'ascii');
    wav.write('fmt ', 12, 'ascii');
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);                   // PCM
    wav.writeUInt16LE(1, 22);                   // mono
    wav.writeUInt32LE(SAMPLE_RATE, 24);
    wav.writeUInt32LE(SAMPLE_RATE * 2, 28);
    wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34);
    wav.write('data', 36, 'ascii');
    wav.writeUInt32LE(dataSize, 40);

    for (let i = 0; i < floatBuffer.length; i++) {
        wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, floatBuffer[i])) * 32767), 44 + i * 2);
    }
    return wav;
}

// Load all samples at startup
const allSamples = SAMPLE_FILES.map(({ file, baseFreq }) => ({
    samples: parseWav(readFileSync(join(SAMPLES_DIR, file))),
    sampleRate: SAMPLES_RATE,
    baseFreq,
}));
console.log(`[meowidi] loaded ${allSamples.length} samples`);

const data = new SlashCommandBuilder()
    .setName('meowidi')
    .setDescription('Convert a Meow-IDI file into meows')
    .addAttachmentOption(option =>
        option.setName('midi')
            .setDescription('The Meow-IDI file to meowify (.mid / .midi)')
            .setRequired(true)
    );

async function execute(interaction) {
    const attachment = interaction.options.getAttachment('midi');
    const name = attachment.name.toLowerCase();
    if (!name.endsWith('.mid') && !name.endsWith('.midi')) {
        await interaction.reply({ content: 'please give me a .mid or .midi file! :(', flags: 64 });
        return;
    }

    await interaction.deferReply();

    try {
        const sample = allSamples[Math.floor(Math.random() * allSamples.length)];

        const res = await fetch(attachment.url);
        if (!res.ok) throw new Error(`download failed: ${res.status}`);
        const midi = new Midi(new Uint8Array(await res.arrayBuffer()));

        const allNotes = midi.tracks.flatMap(t => t.notes);
        if (allNotes.length === 0) {
            await interaction.editReply('no notes found in that Meow-IDI file :(');
            return;
        }

        allNotes.sort((a, b) => a.time - b.time);
        const notes = allNotes.filter(n => n.time < MAX_DURATION_SEC).slice(0, MAX_NOTES);
        const truncated = notes.length < allNotes.length;

        const lastNote = notes[notes.length - 1];
        const totalDuration = Math.min(lastNote.time + lastNote.duration + 1.0, MAX_DURATION_SEC);
        const outBuffer = new Float32Array(Math.ceil(SAMPLE_RATE * totalDuration));

        const fadeOutSamples = Math.floor(0.03 * SAMPLE_RATE); // 30ms fade-out to avoid clicks

        for (const note of notes) {
            const pitched = pitchShift(sample.samples, sample.sampleRate, midiToFreq(note.midi), sample.baseFreq);
            const startSample = Math.floor(note.time * SAMPLE_RATE);
            const noteLenSamples = Math.floor(note.duration * SAMPLE_RATE);
            const len = Math.min(pitched.length, noteLenSamples, outBuffer.length - startSample);
            for (let i = 0; i < len; i++) {
                const fadeGain = i >= len - fadeOutSamples ? (len - i) / fadeOutSamples : 1;
                outBuffer[startSample + i] += pitched[i] * note.velocity * fadeGain;
            }
        }

        // Normalize
        let maxAbs = 0;
        for (let i = 0; i < outBuffer.length; i++) {
            if (Math.abs(outBuffer[i]) > maxAbs) maxAbs = Math.abs(outBuffer[i]);
        }
        if (maxAbs > 0.01) {
            const scale = 0.9 / maxAbs;
            for (let i = 0; i < outBuffer.length; i++) outBuffer[i] *= scale;
        }

        const wavBuffer = encodeWav(outBuffer);
        const file = new AttachmentBuilder(wavBuffer, { name: 'meow.wav' });
        const truncMsg = truncated ? ` (first ${MAX_NOTES} of ${allNotes.length} notes)` : '';
        await interaction.editReply({
            content: `meow! converted ${notes.length} notes${truncMsg} :3`,
            files: [file],
        });
    } catch (err) {
        console.error('[meowidi]', err);
        await interaction.editReply('something went wrong parsing that Meow-IDI file :(');
    }
}

export { data, execute };
