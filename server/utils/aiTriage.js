const CATEGORY_KEYWORDS = {
  sanitation: ['water', 'drain', 'sewage', 'garbage', 'waste', 'plastic', 'toilet', 'handpump', 'fluoride', 'arsenic', 'nala', 'kachra', 'pani'],
  agriculture: ['crop', 'farmer', 'irrigation', 'soil', 'mandi', 'harvest', 'kisan', 'pesticide', 'cold storage'],
  healthcare: ['hospital', 'clinic', 'doctor', 'health', 'anemia', 'malaria', 'dengue', 'asha', 'medicine', 'ambulance'],
  environment: ['air', 'aqi', 'pollution', 'dust', 'smoke', 'tree', 'forest', 'noise', 'pm2.5', 'smog', 'industrial'],
  education: ['school', 'college', 'student', 'teacher', 'library', 'lab', 'classroom', 'literacy'],
  infrastructure: ['road', 'pothole', 'bridge', 'street', 'light', 'traffic', 'highway', 'footpath', 'power', 'grid'],
};

const SPAM_PATTERNS = [
  /buy\s+now/i,
  /crypto\s+airdrop/i,
  /casino/i,
  /free\s+money/i,
  /http:\/\/bit\.ly/i,
];

const hasNonAsciiScript = (text = '') => /[^\x00-\x7F]/.test(text);

const deterministicTriage = ({ title = '', description = '', category = 'other' }) => {
  const combined = `${title} ${description}`.trim();
  const lower = combined.toLowerCase();

  const isSpam =
    combined.length < 12 ||
    SPAM_PATTERNS.some((rx) => rx.test(combined));

  let bestCategory = category;
  let bestScore = 0;
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = words.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat;
    }
  }

  const categoryMatch = bestScore === 0 || bestCategory === category;
  const nonEnglish = hasNonAsciiScript(combined);

  return {
    checked: true,
    provider: 'Janupkram Rule Engine (Set GEMINI_API_KEY for Vision AI)',
    isSafe: !isSpam,
    categoryMatch,
    suggestedCategory: bestScore > 0 ? bestCategory : category,
    confidence: bestScore >= 2 ? 0.88 : bestScore === 1 ? 0.72 : 0.65,
    summary: title ? `${title.slice(0, 110)}` : 'Civic challenge submission verified.',
    translatedEnglish: nonEnglish
      ? `[Regional text detected] ${combined.slice(0, 240)}`
      : '',
    flaggedReason: isSpam ? 'Low-quality or suspected promotional/spam text.' : '',
  };
};

/**
 * Runs Gemini 1.5 Flash multimodal triage when GEMINI_API_KEY is present,
 * falling back cleanly to deterministic keyword/spam moderation otherwise.
 */
const analyzeCivicSubmission = async ({
  title = '',
  description = '',
  category = 'other',
  imageBuffer = null,
  mimeType = '',
}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return deterministicTriage({ title, description, category });
  }

  try {
    const prompt = `You are a civic moderation & triage AI for Janupkram (India).
Analyze the report:
Title: "${title}"
Description: "${description}"
Selected Category: "${category}"

Return ONLY valid JSON with keys:
- isSafe (boolean: false if NSFW/spam/gibberish)
- categoryMatch (boolean: true if problem/image aligns with Selected Category)
- suggestedCategory (one of: agriculture, healthcare, sanitation, education, environment, infrastructure, other)
- confidence (number 0 to 1)
- summary (concise 1-sentence English civic summary)
- translatedEnglish (concise English translation if input contains Hindi/Punjabi/regional language, else empty string)
- flaggedReason (short reason if isSafe is false, else empty string)`;

    const parts = [{ text: prompt }];
    if (imageBuffer && mimeType && mimeType.startsWith('image/')) {
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: imageBuffer.toString('base64'),
        },
      });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
      apiKey
    )}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!response.ok) {
      return deterministicTriage({ title, description, category });
    }

    const payload = await response.json();
    const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(rawText);

    return {
      checked: true,
      provider: 'Google Gemini 1.5 Flash',
      isSafe: parsed.isSafe !== false,
      categoryMatch: parsed.categoryMatch !== false,
      suggestedCategory: parsed.suggestedCategory || category,
      confidence: Number(parsed.confidence) || 0.85,
      summary: String(parsed.summary || '').slice(0, 240),
      translatedEnglish: String(parsed.translatedEnglish || '').slice(0, 400),
      flaggedReason: String(parsed.flaggedReason || '').slice(0, 200),
    };
  } catch {
    return deterministicTriage({ title, description, category });
  }
};

module.exports = { analyzeCivicSubmission };
