export const rewritePrompt = (text: string, tone: string) => `
You are a helpful writing assistant. Please rewrite the following text in a ${tone} tone.
Return ONLY the rewritten text, with no conversational filler or markdown blocks.

Text:
${text}
`;
