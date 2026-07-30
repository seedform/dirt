"use client";

import { useTransition } from "react";
import { XIcon } from "lucide-react";
import { deleteSurveyAction } from "@/lib/survey-actions";
import { cn } from "@/lib/utils";

export function DeleteSurveyButton({
  surveyId,
  teamName,
  className,
}: {
  surveyId: string;
  teamName: string;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(`Delete the survey for "${teamName}"? This cannot be undone.`)) return;
    startTransition(() => {
      deleteSurveyAction(surveyId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={`Delete survey for ${teamName}`}
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-none text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-50",
        className
      )}
    >
      <XIcon className="size-3.5" />
    </button>
  );
}
