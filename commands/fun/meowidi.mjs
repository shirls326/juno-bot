import { SlashCommandBuilder, AttachmentBuilder, MessageFlags } from 'discord.js';
import pkg from '@tonejs/midi';
const { Midi } = pkg;
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLES_DIR = join(__dirname, '..', '..', 'assets', 'meowidi', 'samples');

const SAMPLE_RATE = 44100;
const MAX_DURATION_SEC = 30;
const MAX_NOTES = 2000;
const MAX_MIDI_SIZE = 10 * 1024 * 1024; // 10 MB

function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

const SOURCE_SAMPLE_RATE = 48000;

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
    if (dataOffset === -1 || dataSize <= 0) throw new Error('WAV data chunk not found or empty');
    const totalSamples = dataSize / 2; // 16-bit = 2 bytes per sample
    const mono = new Float32Array(totalSamples);
    for (let s = 0; s < totalSamples; s++)
        mono[s] = buf.readInt16LE(dataOffset + s * 2) / 32768;
    return mono;
}

/** Resample and pitch-shift a sample to a target frequency using linear interpolation. */
function pitchShift(samples, srcRate, targetFreq, baseFreq) {
    // Combined rate-conversion + pitch-shift into one pass
    // Clamp playbackRate to avoid extreme allocations from very low/high MIDI notes
    const playbackRate = Math.max(0.1, Math.min(10, (targetFreq / baseFreq) * (srcRate / SAMPLE_RATE)));
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

// Lazily load samples on first use to avoid delaying bot startup
let loadedSamples = null;

function getSamples() {
    if (!loadedSamples) {
        loadedSamples = SAMPLE_FILES.map(({ file, baseFreq }) => ({
            samples: parseWav(readFileSync(join(SAMPLES_DIR, file))),
            sampleRate: SOURCE_SAMPLE_RATE,
            baseFreq,
        }));
        console.log(`[meowidi] loaded ${loadedSamples.length} samples`);
    }
    return loadedSamples;
}

const data = new SlashCommandBuilder()
    .setName('meowidi')
    .setDescription('Convert a Meow-IDI file into meows')
    .addAttachmentOption(option =>
        option.setName('midi')
            .setDescription('The Meow-IDI file to meowify (.mid / .midi)')
            .setRequired(true)
    );

async function fetchMidi(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`download failed: ${res.status}`);
        const contentLength = res.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > MAX_MIDI_SIZE)
            throw new Error('MIDI file too large');
        return new Midi(new Uint8Array(await res.arrayBuffer()));
    } finally {
        clearTimeout(timeout);
    }
}

function extractNotes(midi) {
    const allNotes = midi.tracks.flatMap(t => t.notes);
    allNotes.sort((a, b) => a.time - b.time);
    const timeFiltered = allNotes.filter(n => n.time < MAX_DURATION_SEC);
    const notes = timeFiltered.slice(0, MAX_NOTES);
    const timeTruncated = timeFiltered.length < allNotes.length;
    const noteTruncated = notes.length < timeFiltered.length;
    return { notes, allNotes, timeTruncated, noteTruncated };
}

function renderNotes(notes, sample) {
    const lastNote = notes[notes.length - 1];
    const totalDuration = Math.min(lastNote.time + lastNote.duration + 1.0, MAX_DURATION_SEC);
    const outBuffer = new Float32Array(Math.ceil(SAMPLE_RATE * totalDuration));
    const fadeOutSamples = Math.floor(0.03 * SAMPLE_RATE); // 30ms fade-out to avoid clicks
    const pitchCache = new Map();

    for (const note of notes) {
        const startSample = Math.floor(note.time * SAMPLE_RATE);
        const noteLenSamples = Math.floor(note.duration * SAMPLE_RATE);

        if (!pitchCache.has(note.midi)) {
            pitchCache.set(note.midi, pitchShift(sample.samples, sample.sampleRate, midiToFreq(note.midi), sample.baseFreq));
        }
        const pitched = pitchCache.get(note.midi);
        const len = Math.min(pitched.length, noteLenSamples, outBuffer.length - startSample);
        for (let i = 0; i < len; i++) {
            const fadeGain = i >= len - fadeOutSamples ? (len - i) / fadeOutSamples : 1;
            outBuffer[startSample + i] += pitched[i] * note.velocity * fadeGain;
        }
    }
    return outBuffer;
}

function normalizeBuffer(buffer) {
    let maxAbs = 0;
    for (let i = 0; i < buffer.length; i++) {
        if (Math.abs(buffer[i]) > maxAbs) maxAbs = Math.abs(buffer[i]);
    }
    if (maxAbs > 0.01) {
        const scale = 0.9 / maxAbs;
        for (let i = 0; i < buffer.length; i++) buffer[i] *= scale;
    }
}

async function execute(interaction) {
    const attachment = interaction.options.getAttachment('midi');
    const name = attachment.name.toLowerCase();
    if (!name.endsWith('.mid') && !name.endsWith('.midi')) {
        await interaction.reply({ content: 'please give me a .mid or .midi file! :(', flags: MessageFlags.Ephemeral });
        return;
    }

    await interaction.deferReply();

    try {
        const samples = getSamples();
        const sample = samples[Math.floor(Math.random() * samples.length)];

        const midi = await fetchMidi(attachment.url);
        const { notes, allNotes, timeTruncated, noteTruncated } = extractNotes(midi);
        if (notes.length === 0) {
            await interaction.editReply('no notes found in that Meow-IDI file :(');
            return;
        }

        const outBuffer = renderNotes(notes, sample);
        normalizeBuffer(outBuffer);

        const wavBuffer = encodeWav(outBuffer);
        const baseName = attachment.name.replace(/\.(mid|midi)$/i, '');
        const file = new AttachmentBuilder(wavBuffer, { name: `${baseName}.wav` });
        let truncMsg = '';
        if (noteTruncated && timeTruncated) {
            truncMsg = ` (first ${allNotes.length} of ${MAX_NOTES} notes, first ${MAX_DURATION_SEC}s)`;
        } else if (noteTruncated) {
            truncMsg = ` (first ${allNotes.length} of ${MAX_NOTES} notes)`;
        } else if (timeTruncated) {
            truncMsg = ` (first ${MAX_DURATION_SEC}s of song)`;
        }
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
