const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function generateStudyPlan(subject: string, topic: string, difficulty: string, daysLeft: number) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured in .env');
  }

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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  console.log(`[Gemini API] Requesting study plan for ${subject} (${topic}) for ${planDays} days using gemini-2.5-flash...`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    })
  });

  console.log(`[Gemini API] Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Gemini API] Error response:`, errorText);
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    console.error('[Gemini API] Error: No content returned in result candidates');
    throw new Error('No content returned from Gemini');
  }

  try {
    const parsed = JSON.parse(rawText.trim());
    if (parsed && Array.isArray(parsed.schedule)) {
      console.log('[Gemini API] Study plan generated and parsed successfully.', parsed.schedule);
      return parsed.schedule;
    }
    throw new Error('Response is missing schedule array');
  } catch (err) {
    console.error('[Gemini API] Parsing failed for response text:', rawText, err);
    throw new Error('Failed to parse study plan JSON structure');
  }
}
