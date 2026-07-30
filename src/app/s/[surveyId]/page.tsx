import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SurveyForm } from "@/components/survey-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default async function SurveyPage({
  params,
  searchParams,
}: {
  params: Promise<{ surveyId: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { surveyId } = await params;
  const { submitted } = await searchParams;

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    select: { id: true },
  });
  if (!survey) notFound();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6">
      <Card className="w-full max-w-md">
        {submitted === "1" ? (
          <CardHeader>
            <CardTitle>Thank you!</CardTitle>
            <CardDescription>Your dietary restrictions have been submitted.</CardDescription>
          </CardHeader>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Dietary restrictions</CardTitle>
              <CardDescription>
                Let us know about any dietary restrictions you have.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SurveyForm surveyId={surveyId} />
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
