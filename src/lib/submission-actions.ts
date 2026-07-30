"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizeWithGemini } from "@/lib/gemini";

// Fed to a lightweight LLM downstream, so entries are restricted to
// [ a-z0-9] only — this also doubles as prompt-injection sanitization.
function sanitizeDietaryRestriction(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function createSubmissionAction(formData: FormData): Promise<void> {
  const surveyId = String(formData.get("surveyId") ?? "");

  // Server Actions are reachable via direct POST regardless of UI gating,
  // so re-verify the survey exists here rather than trusting the page render.
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    select: { id: true },
  });
  if (!survey) throw new Error("Survey not found");

  let parsed: unknown;
  try {
    parsed = JSON.parse(String(formData.get("dietaryRestrictions") ?? "[]"));
  } catch {
    parsed = [];
  }
  const items = Array.isArray(parsed) ? parsed : [];
  const rawItems = items.map((item) => String(item));

  // Semantic normalization + prompt-injection screening via Gemini. Skipped
  // when there's nothing to sanitize. Output item count may be lower than
  // input (consolidation/dropped-invalid), so treat it as a new unordered
  // candidate list, not positionally mapped to the originals.
  const candidates = rawItems.length > 0 ? await normalizeWithGemini(rawItems) : [];

  // Sanitize/normalize/dedupe, then re-enforce the entry-count and
  // per-entry length limits server-side (the client tag input only
  // enforces these as a UX affordance, not a security boundary). This
  // regex pass is a deterministic backstop on top of Gemini's own
  // normalization — defense in depth.
  const dietaryRestrictions = Array.from(
    new Set(
      candidates
        .map((item) => sanitizeDietaryRestriction(item))
        .filter((s) => s.length > 0 && s.length <= 32)
    )
  ).slice(0, 30);

  await prisma.submission.create({ data: { surveyId, dietaryRestrictions } });

  redirect(`/s/${surveyId}?submitted=1`);
}
