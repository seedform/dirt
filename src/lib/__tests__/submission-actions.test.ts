import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    survey: { findUnique: vi.fn() },
    submission: { create: vi.fn() },
  },
}));
vi.mock("@/lib/gemini", () => ({
  normalizeWithGemini: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { normalizeWithGemini } from "@/lib/gemini";
import { redirect } from "next/navigation";
import { createSubmissionAction, type SubmissionState } from "@/lib/submission-actions";

const findUnique = vi.mocked(prisma.survey.findUnique);
const create = vi.mocked(prisma.submission.create);
const normalize = vi.mocked(normalizeWithGemini);
const redirectMock = vi.mocked(redirect);

const prevState: SubmissionState = { error: null };

function formDataFor(surveyId: string, dietaryRestrictions: unknown) {
  const fd = new FormData();
  fd.set("surveyId", surveyId);
  fd.set("dietaryRestrictions", JSON.stringify(dietaryRestrictions));
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  // @ts-expect-error - only the fields the action reads are needed
  findUnique.mockResolvedValue({ id: "survey-1" });
  create.mockResolvedValue(undefined as never);
});

describe("createSubmissionAction", () => {
  it("throws when the survey does not exist", async () => {
    findUnique.mockResolvedValue(null);

    await expect(
      createSubmissionAction(prevState, formDataFor("missing", ["vegan"]))
    ).rejects.toThrow("Survey not found");

    expect(create).not.toHaveBeenCalled();
  });

  it("creates a submission with sanitized labels and redirects", async () => {
    normalize.mockResolvedValue(["Vegan", "Peanut Allergy"]);

    await createSubmissionAction(prevState, formDataFor("survey-1", ["vegan", "peanut allergy"]));

    expect(create).toHaveBeenCalledWith({
      data: {
        surveyId: "survey-1",
        dietaryRestrictions: ["vegan", "peanut allergy"],
      },
    });
    expect(redirectMock).toHaveBeenCalledWith("/s/survey-1?submitted=1");
  });

  it("sanitizes disallowed characters, dedupes, and drops overlong entries", async () => {
    normalize.mockResolvedValue([
      "  VEGAN!! ",
      "vegan",
      "no---fish",
      "a".repeat(40),
    ]);

    await createSubmissionAction(prevState, formDataFor("survey-1", ["x"]));

    expect(create).toHaveBeenCalledWith({
      data: {
        surveyId: "survey-1",
        dietaryRestrictions: ["vegan", "no-fish"],
      },
    });
  });

  it("caps the stored list at 30 entries", async () => {
    normalize.mockResolvedValue(Array.from({ length: 40 }, (_, i) => `item-${i}`));

    await createSubmissionAction(prevState, formDataFor("survey-1", ["x"]));

    const call = create.mock.calls[0][0] as { data: { dietaryRestrictions: string[] } };
    expect(call.data.dietaryRestrictions).toHaveLength(30);
  });

  it("treats malformed JSON dietaryRestrictions as empty and skips normalization", async () => {
    const fd = new FormData();
    fd.set("surveyId", "survey-1");
    fd.set("dietaryRestrictions", "{not valid json");

    await createSubmissionAction(prevState, fd);

    expect(normalize).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith({
      data: { surveyId: "survey-1", dietaryRestrictions: [] },
    });
  });

  it("treats non-array JSON dietaryRestrictions as empty and skips normalization", async () => {
    await createSubmissionAction(prevState, formDataFor("survey-1", { not: "an array" }));

    expect(normalize).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith({
      data: { surveyId: "survey-1", dietaryRestrictions: [] },
    });
  });

  it("returns an error state and does not create a submission when Gemini fails", async () => {
    normalize.mockRejectedValue(new Error("Gemini request error"));

    const result = await createSubmissionAction(prevState, formDataFor("survey-1", ["vegan"]));

    expect(result).toEqual({ error: "Submission failed" });
    expect(create).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
