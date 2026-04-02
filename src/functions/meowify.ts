
const NO_MEOW_SUBSTRINGS = ["time", "some", "sum", "ome", "mer", "meow"];
const URL_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+/i;

function meowify(input: string): string {
    if (!input || URL_REGEX.test(input)) return input;

    const processed = input.replace(/\w+/g, (word) => {
        const lowerWord = word.toLowerCase();

        for (const sub of NO_MEOW_SUBSTRINGS) {
            if (lowerWord.includes(sub)) return word;
        }

        const lowerBase = lowerWord.replace(/s+$/i, "");
        if (lowerBase.length <= 5) return word;

        const validMatches = [];

        for (let i = 0; i < lowerBase.length - 1; i++) {
            const pair = lowerBase.slice(i, i + 2);
            if (pair === "me" || pair === "mi" || pair === "my") {
                if (i > lowerBase.length - 3) continue;
                validMatches.push(i);
            }
        }

        if (validMatches.length === 1) {
            const i = validMatches[0] ?? 0;
            // Preserve original casing of the start/end of the word
            return word.slice(0, i) + "MEOW" + word.slice(i + 2);
        }

        return word;
    });

    // Discord API Safety: Limit to 2000 chars
    return processed.length > 2000 ? processed.slice(0, 1997) + "..." : processed;
}

export { meowify };
