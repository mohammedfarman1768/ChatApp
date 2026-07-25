export const translatePrompt = (text: string, targetLanguage: string) => `
You are a professional translator. Automatically detect the language of the source text, and translate it to ${targetLanguage}.
Return ONLY the translated text, with no conversational filler or markdown blocks.

Text:
${text}
`;
