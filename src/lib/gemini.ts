import { callGemini } from './aiEngine';

export async function generateStudyPlan(subject: string, topic: string, difficulty: string, daysLeft: number) {
  const planDays = Math.min(5, daysLeft);
  
  const prompt = `Generate a personalized day-by-day study plan for subject "${subject}", topic "${topic}".
Difficulty Level: ${difficulty}.
Duration: ${planDays} days.
Provide a clear breakdown of specific subtopics/tasks to cover for each day and set hours of study accordingly (typically 2 to 4 hours per day depending on difficulty).
You MUST respond with a valid JSON object matching the following structure:
{
  "schedule": [
    {
      "day": "Day 1",
      "topics": ["Subtopic 1", "Practice exercise"],
      "hours": 3,
      "completed": false
    }
  ]
}
Return ONLY a valid JSON object. Do not include markdown code block tags (\`\`\`json or \`\`\`) in your response. Just raw JSON text.`;

  console.log(`[Gemini API] Requesting study plan for ${subject} (${topic}) for ${planDays} days via callGemini...`);

  try {
    const rawText = await callGemini(prompt);
    const parsed = JSON.parse(rawText.trim());
    if (parsed && Array.isArray(parsed.schedule)) {
      console.log('[Gemini API] Study plan generated and parsed successfully.', parsed.schedule);
      return parsed.schedule;
    }
    throw new Error('Response is missing schedule array');
  } catch (err: any) {
    console.error('[Gemini API] Parsing failed or API error:', err);
    throw err;
  }
}
