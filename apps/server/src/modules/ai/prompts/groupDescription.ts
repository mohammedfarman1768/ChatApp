export const groupDescriptionPrompt = (name: string, purpose: string) => `
You are an AI assistant helping a community manager write a group description.
Given the group's name and purpose, write a short, engaging description (1-2 paragraphs) that will invite people to join.
Return ONLY the description text, with no conversational filler or markdown blocks.

Name: ${name}
Purpose: ${purpose}
`;
