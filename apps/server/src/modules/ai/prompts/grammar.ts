export const grammarPrompt = (text: string) => `
You are an expert editor. Fix any grammar, spelling, or punctuation errors in the following text.
Keep the original meaning and tone intact. Do not add any extra commentary.
Return ONLY the corrected text.

Text:
${text}
`;
