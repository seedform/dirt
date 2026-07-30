"use client";

import { useActionState, useEffect, useState } from "react";
import { TagInput, type Tag } from "emblor";
import { createSubmissionAction, type SubmissionState } from "@/lib/submission-actions";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

const initialState: SubmissionState = { error: null };

export function SurveyForm({ surveyId }: { surveyId: string }) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const [state, formAction, pending] = useActionState(createSubmissionAction, initialState);

  useEffect(() => {
    if (state.error) {
      toast.add({ title: state.error, type: "error" });
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
      <Button type="submit" className="self-end" disabled={pending}>
        Submit
      </Button>
    </form>
  );
}
