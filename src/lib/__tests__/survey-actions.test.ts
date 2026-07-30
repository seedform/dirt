import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    survey: { findUnique: vi.fn(), delete: vi.fn() },
    submission: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn() },
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { auth0 } from "@/lib/auth0";
import { revalidatePath } from "next/cache";
import { deleteSurveyAction } from "@/lib/survey-actions";

const findUnique = vi.mocked(prisma.survey.findUnique);
const transaction = vi.mocked(prisma.$transaction);
const getSession = vi.mocked(auth0.getSession);
const revalidate = vi.mocked(revalidatePath);

beforeEach(() => {
  vi.clearAllMocks();
  transaction.mockResolvedValue(undefined as never);
});

describe("deleteSurveyAction", () => {
  it("throws when not authenticated", async () => {
    getSession.mockResolvedValue(null);

    await expect(deleteSurveyAction("survey-1")).rejects.toThrow("Not authenticated");
    expect(findUnique).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it("throws when the survey does not exist", async () => {
    // @ts-expect-error - only the fields the code reads are needed
    getSession.mockResolvedValue({ user: { sub: "user-1" } });
    findUnique.mockResolvedValue(null);

    await expect(deleteSurveyAction("survey-1")).rejects.toThrow("Survey not found");
    expect(transaction).not.toHaveBeenCalled();
  });

  it("throws when the survey belongs to a different user", async () => {
    // @ts-expect-error - only the fields the code reads are needed
    getSession.mockResolvedValue({ user: { sub: "user-1" } });
    // @ts-expect-error - only the fields the code reads are needed
    findUnique.mockResolvedValue({ id: "survey-1", userId: "someone-else" });

    await expect(deleteSurveyAction("survey-1")).rejects.toThrow("Survey not found");
    expect(transaction).not.toHaveBeenCalled();
  });

  it("deletes submissions and the survey in a transaction, then revalidates", async () => {
    // @ts-expect-error - only the fields the code reads are needed
    getSession.mockResolvedValue({ user: { sub: "user-1" } });
    // @ts-expect-error - only the fields the code reads are needed
    findUnique.mockResolvedValue({ id: "survey-1", userId: "user-1" });

    await deleteSurveyAction("survey-1");

    expect(prisma.submission.deleteMany).toHaveBeenCalledWith({ where: { surveyId: "survey-1" } });
    expect(prisma.survey.delete).toHaveBeenCalledWith({ where: { id: "survey-1" } });
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(revalidate).toHaveBeenCalledWith("/dashboard");
  });
});
