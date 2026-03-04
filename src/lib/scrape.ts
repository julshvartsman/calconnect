import * as cheerio from "cheerio";

const FIXED_QUESTIONS = [
  { key: "who_eligible", prompt: "Who is eligible?" },
  { key: "costs_fees", prompt: "Are there costs or fees?" },
  {
    key: "deadlines_timing",
    prompt: "Are there important deadlines or timing constraints?",
  },
  { key: "how_to_apply", prompt: "How does a student apply or start?" },
  { key: "required_docs", prompt: "What should a student bring or prepare?" },
  {
    key: "limitations_gotchas",
    prompt: "What limitations or gotchas should students know?",
  },
] as const;

function clipText(raw: string, maxLength = 6000): string {
  const normalized = raw.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength)}...`
    : normalized;
}

export async function fetchAndExtractPage(url: string, timeoutMs = 15_000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "CalConnectBot/1.0 (+resource summarizer)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch source page: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $("script, style, nav, footer, header, noscript, aside").remove();

    const bestContainer =
      $("main").first().text() ||
      $("#content").first().text() ||
      $(".content").first().text() ||
      $("body").text();

    return clipText(bestContainer);
  } finally {
    clearTimeout(timer);
  }
}

function sentenceCandidates(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30 && sentence.length < 240);
}

function includesAny(target: string, words: string[]): boolean {
  return words.some((word) => target.includes(word));
}

function answerQuestionByHeuristic(text: string, questionKey: string): string {
  const lower = text.toLowerCase();

  if (questionKey === "costs_fees") {
    if (lower.includes("free")) return "This resource appears to be free.";
    if (includesAny(lower, ["fee", "cost", "payment", "charge"])) {
      return "Costs may apply; check the official page details before visiting.";
    }
  }

  if (questionKey === "who_eligible") {
    if (includesAny(lower, ["all students", "any student", "undergraduate"])) {
      return "Eligibility appears to include at least some student groups listed on the page.";
    }
  }

  if (questionKey === "deadlines_timing") {
    if (includesAny(lower, ["deadline", "before", "by ", "within"])) {
      return "There are likely timing requirements; confirm exact deadlines on the official page.";
    }
  }

  if (questionKey === "required_docs") {
    if (includesAny(lower, ["bring", "id", "document", "proof", "transcript"])) {
      return "This resource may require documents or proof; review requirements before going.";
    }
  }

  if (questionKey === "how_to_apply") {
    if (includesAny(lower, ["apply", "submit", "form", "appointment"])) {
      return "The page describes an application or form flow for getting started.";
    }
  }

  if (questionKey === "limitations_gotchas") {
    if (includesAny(lower, ["limited", "subject to", "availability", "not eligible"])) {
      return "There are likely constraints or exceptions students should review.";
    }
  }

  return "Not explicitly stated in the extracted page text.";
}

export function buildResourceSummary(extractedText: string) {
  const sentences = sentenceCandidates(extractedText);
  const keyPoints = sentences.slice(0, 5);

  const answers = FIXED_QUESTIONS.map((question) => ({
    key: question.key,
    prompt: question.prompt,
    answer: answerQuestionByHeuristic(extractedText, question.key),
  }));

  return {
    keyPoints,
    answers,
    rawExcerpt: extractedText.slice(0, 1200),
  };
}
