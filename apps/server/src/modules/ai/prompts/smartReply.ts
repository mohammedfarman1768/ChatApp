export const smartReplyPrompt = (messages: string) => `
You are an AI assistant helping a user reply to a conversation. 
Based on the following recent messages, suggest 1 to 3 short, natural-sounding replies.
Return ONLY a JSON array of strings. Do not include markdown blocks like \`\`\`json.

Recent messages:
${messages}
`;
