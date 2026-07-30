import { revalidatePath } from "next/cache";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";

export type SurveyAggregationItem = { label: string; count: number };

export type DashboardData =
  | { survey: null }
  | {
      survey: { id: string; createdAt: Date };
      aggregation: SurveyAggregationItem[];
      totalSubmissions: number;
    };

export async function createSurveyAction(_formData: FormData): Promise<void> {
  "use server";

  const session = await auth0.getSession();
  if (!session) throw new Error("Not authenticated");

  const { sub: userId, email, name } = session.user;
  if (!email) throw new Error("Session user is missing an email claim");

  // No User row is created anywhere on login; Survey.userId has a required
  // FK to User.id, so upsert first or survey.create() throws a constraint error.
  await prisma.user.upsert({
    where: { id: userId },
    update: { email, name: name ?? email },
    create: { id: userId, email, name: name ?? email },
  });

  // Idempotency guard: the page only renders this form when no survey
  // exists, so this is a safety net against double-submits, not the
  // primary gate.
  const existing = await prisma.survey.findFirst({ where: { userId } });
  if (!existing) {
    await prisma.survey.create({ data: { userId } });
  }

  revalidatePath("/dashboard");
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const survey = await prisma.survey.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (!survey) return { survey: null };

  const submissions = await prisma.submission.findMany({
    where: { surveyId: survey.id },
    select: { dietaryRestrictions: true },
  });

  // dietaryRestrictions is Prisma.JsonValue (no fixed shape yet — no
  // submission-writer exists in the app yet); guard defensively assuming
  // it's an array of strings, e.g. ["Vegan"] or ["Gluten-Free", "Peanut Allergy"].
  const counts = new Map<string, number>();
  for (const { dietaryRestrictions } of submissions) {
    if (!Array.isArray(dietaryRestrictions)) continue;
    for (const item of dietaryRestrictions) {
      if (typeof item !== "string") continue;
      const label = item.trim();
      if (!label) continue;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }

  const aggregation = Array.from(counts, ([label, count]) => ({ label, count })).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label)
  );

  return {
    survey: { id: survey.id, createdAt: survey.createdAt },
    aggregation,
    totalSubmissions: submissions.length,
  };
}

export function getSurveyLink(surveyId: string): string {
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  return `${baseUrl}/s/${surveyId}`;
}
