export const groupRulesPrompt = (name: string, purpose: string) => `
You are an AI assistant helping a community manager write rules for their group.
Given the group's name and purpose, generate a JSON array of 5 to 10 suggested rules.
Return ONLY a JSON array of strings. Do not include markdown blocks like \`\`\`json.

Name: ${name}
Purpose: ${purpose}
`;
