import { revalidatePath } from "next/cache";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";

export type SurveyAggregationItem = { label: string; count: number };

export type SurveyWithStats = {
  id: string;
  teamName: string;
  createdAt: Date;
  aggregation: SurveyAggregationItem[];
  totalSubmissions: number;
};

export type DashboardData = { surveys: SurveyWithStats[] };

export async function createSurveyAction(formData: FormData): Promise<void> {
  "use server";

  const session = await auth0.getSession();
  if (!session) throw new Error("Not authenticated");

  const { sub: userId, email, name } = session.user;
  if (!email) throw new Error("Session user is missing an email claim");

  const teamName = String(formData.get("teamName") ?? "").trim();
  if (!teamName) throw new Error("Team name is required");

  // No User row is created anywhere on login; Survey.userId has a required
  // FK to User.id, so upsert first or survey.create() throws a constraint error.
  await prisma.user.upsert({
    where: { id: userId },
    update: { email, name: name ?? email },
    create: { id: userId, email, name: name ?? email },
  });

  await prisma.survey.create({ data: { userId, teamName } });

  revalidatePath("/dashboard");
}

function aggregateSubmissions(
  submissions: { dietaryRestrictions: unknown }[]
): SurveyAggregationItem[] {
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

  return Array.from(counts, ([label, count]) => ({ label, count })).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label)
  );
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const surveys = await prisma.survey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { submissions: { select: { dietaryRestrictions: true } } },
  });

  return {
    surveys: surveys.map((survey) => ({
      id: survey.id,
      teamName: survey.teamName,
      createdAt: survey.createdAt,
      aggregation: aggregateSubmissions(survey.submissions),
      totalSubmissions: survey.submissions.length,
    })),
  };
}

export function getSurveyLink(surveyId: string): string {
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  return `${baseUrl}/s/${surveyId}`;
}
