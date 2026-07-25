export const moderationPrompt = (text: string) => `
You are a content moderation AI. Analyze the following text and determine if it violates safety guidelines.
Return ONLY a valid JSON object with the following structure:
{
  "safe": boolean,
  "categories": {
    "spam": boolean,
    "toxicity": boolean,
    "violence": boolean,
    "adult": boolean,
    "selfHarm": boolean
  },
  "confidence": number, // between 0.0 and 1.0
  "reason": "short explanation if not safe, else empty string"
}

Do not include markdown blocks like \`\`\`json. Return the raw JSON directly.

Text:
${text}
`;
