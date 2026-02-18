/**
 * DailyDoom Playtester — Vision Verification via Claude API
 *
 * Sends screenshots to Claude Haiku's vision API for visual analysis.
 * Gracefully unavailable when ANTHROPIC_API_KEY is not set.
 */

const Anthropic = require('@anthropic-ai/sdk');

function isVisionAvailable() {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Send a screenshot to Claude Haiku for visual verification.
 *
 * @param {Buffer} pngBuffer — PNG image buffer (from page.screenshot())
 * @param {string} prompt — What to verify in the image
 * @returns {Promise<{ pass: boolean, explanation: string }>}
 */
async function verifyScreenshot(pngBuffer, prompt) {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: pngBuffer.toString('base64'),
            },
          },
          {
            type: 'text',
            text: prompt + '\n\nRespond with EXACTLY this JSON format and nothing else:\n{"pass": true/false, "explanation": "brief reason"}',
          },
        ],
      },
    ],
  });

  const text = response.content[0].text.trim();

  // Extract JSON from the response (handle markdown code fences)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { pass: false, explanation: `Could not parse vision response: ${text}` };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      pass: !!parsed.pass,
      explanation: String(parsed.explanation || ''),
    };
  } catch {
    return { pass: false, explanation: `Invalid JSON from vision API: ${text}` };
  }
}

module.exports = { isVisionAvailable, verifyScreenshot };
