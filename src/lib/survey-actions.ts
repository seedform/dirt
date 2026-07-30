"use server";

import { revalidatePath } from "next/cache";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";

export async function deleteSurveyAction(surveyId: string): Promise<void> {
  const session = await auth0.getSession();
  if (!session) throw new Error("Not authenticated");

  const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
  if (!survey || survey.userId !== session.user.sub) {
    throw new Error("Survey not found");
  }

  await prisma.$transaction([
    prisma.submission.deleteMany({ where: { surveyId } }),
    prisma.survey.delete({ where: { id: surveyId } }),
  ]);

  revalidatePath("/dashboard");
}
