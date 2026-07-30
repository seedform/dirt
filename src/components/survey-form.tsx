"use client";

import { useState } from "react";
import { TagInput, type Tag } from "emblor";
import { createSubmissionAction } from "@/lib/submission-actions";
import { Button } from "@/components/ui/button";

export function SurveyForm({ surveyId }: { surveyId: string }) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

  return (
    <form action={createSubmissionAction} className="flex flex-col gap-4">
      <input type="hidden" name="surveyId" value={surveyId} />
      <input
        type="hidden"
        name="dietaryRestrictions"
        value={JSON.stringify(tags.map((tag) => tag.text))}
      />
      <TagInput
        tags={tags}
        setTags={setTags}
        activeTagIndex={activeTagIndex}
        setActiveTagIndex={setActiveTagIndex}
        maxTags={30}
        maxLength={32}
        placeholder="Type a dietary restriction and press Enter"
      />
      <Button type="submit" className="self-end">
        Submit
      </Button>
    </form>
  );
}
