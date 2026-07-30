import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    survey: { findUnique: vi.fn() },
  },
}));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SurveyPage from "@/app/s/[surveyId]/page";

const findUnique = vi.mocked(prisma.survey.findUnique);
const notFoundMock = vi.mocked(notFound);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SurveyPage", () => {
  it("calls notFound() when the survey no longer exists (e.g. after deletion)", async () => {
    findUnique.mockResolvedValue(null);

    await expect(
      SurveyPage({
        params: Promise.resolve({ surveyId: "deleted-survey" }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalled();
  });

  it("renders the survey form and does not call notFound() when the survey exists", async () => {
    // @ts-expect-error - only the fields the code reads are needed
    findUnique.mockResolvedValue({ id: "survey-1" });

    const result = await SurveyPage({
      params: Promise.resolve({ surveyId: "survey-1" }),
      searchParams: Promise.resolve({}),
    });

    expect(notFoundMock).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });
});
