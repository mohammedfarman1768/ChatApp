export const summaryPrompt = (messages: string) => `
You are a helpful assistant. Please summarize the following conversation.
Extract the main topics discussed, generate a short summary, a list of bullet points, and any action items.

Return ONLY a valid JSON object with the following structure:
{
  "title": "A short title for the conversation",
  "summary": "A 1-3 sentence summary",
  "bulletPoints": ["point 1", "point 2"],
  "actionItems": ["action 1"]
}

Do not include markdown blocks like \`\`\`json. Return the raw JSON directly.

Conversation:
${messages}
`;
