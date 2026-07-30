import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    survey: { findMany: vi.fn(), create: vi.fn() },
    user: { upsert: vi.fn() },
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
import { createSurveyAction, getDashboardData } from "@/lib/actions";

const findMany = vi.mocked(prisma.survey.findMany);
const surveyCreate = vi.mocked(prisma.survey.create);
const userUpsert = vi.mocked(prisma.user.upsert);
const getSession = vi.mocked(auth0.getSession);
const revalidate = vi.mocked(revalidatePath);

beforeEach(() => {
  vi.clearAllMocks();
});

function submission(dietaryRestrictions: unknown) {
  return { dietaryRestrictions };
}

describe("getDashboardData / aggregation", () => {
  it("counts labels across submissions and sorts by count desc", async () => {
    findMany.mockResolvedValue([
      {
        id: "survey-1",
        teamName: "Team A",
        createdAt: new Date("2026-01-01"),
        submissions: [
          submission(["vegan"]),
          submission(["vegan"]),
          submission(["vegan"]),
          submission(["peanut-allergy"]),
        ],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    const data = await getDashboardData("user-1");

    expect(data.surveys).toHaveLength(1);
    expect(data.surveys[0].totalSubmissions).toBe(4);
    expect(data.surveys[0].aggregation).toEqual([
      { label: "vegan", count: 3 },
      { label: "peanut-allergy", count: 1 },
    ]);
  });

  it("breaks ties by label alphabetically", async () => {
    findMany.mockResolvedValue([
      {
        id: "survey-1",
        teamName: "Team A",
        createdAt: new Date(),
        submissions: [submission(["vegan"]), submission(["gluten-free"])],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    const data = await getDashboardData("user-1");

    expect(data.surveys[0].aggregation).toEqual([
      { label: "gluten-free", count: 1 },
      { label: "vegan", count: 1 },
    ]);
  });

  it("returns an empty aggregation for a survey with no submissions", async () => {
    findMany.mockResolvedValue([
      { id: "survey-1", teamName: "Team A", createdAt: new Date(), submissions: [] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    const data = await getDashboardData("user-1");

    expect(data.surveys[0].aggregation).toEqual([]);
    expect(data.surveys[0].totalSubmissions).toBe(0);
  });

  it("skips malformed dietaryRestrictions entries instead of throwing", async () => {
    findMany.mockResolvedValue([
      {
        id: "survey-1",
        teamName: "Team A",
        createdAt: new Date(),
        submissions: [
          submission({ not: "an array" }),
          submission(["vegan", 42, null]),
          submission(null),
        ],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    const data = await getDashboardData("user-1");

    expect(data.surveys[0].aggregation).toEqual([{ label: "vegan", count: 1 }]);
    expect(data.surveys[0].totalSubmissions).toBe(3);
  });

  it("aggregates each survey independently", async () => {
    findMany.mockResolvedValue([
      {
        id: "survey-1",
        teamName: "Team A",
        createdAt: new Date(),
        submissions: [submission(["vegan"])],
      },
      {
        id: "survey-2",
        teamName: "Team B",
        createdAt: new Date(),
        submissions: [submission(["peanut-allergy"]), submission(["peanut-allergy"])],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    const data = await getDashboardData("user-1");

    expect(data.surveys[0].aggregation).toEqual([{ label: "vegan", count: 1 }]);
    expect(data.surveys[1].aggregation).toEqual([{ label: "peanut-allergy", count: 2 }]);
  });
});

describe("createSurveyAction", () => {
  function formDataFor(teamName: string) {
    const fd = new FormData();
    fd.set("teamName", teamName);
    return fd;
  }

  it("throws when not authenticated", async () => {
    getSession.mockResolvedValue(null);

    await expect(createSurveyAction(formDataFor("Team A"))).rejects.toThrow("Not authenticated");
    expect(userUpsert).not.toHaveBeenCalled();
    expect(surveyCreate).not.toHaveBeenCalled();
  });

  it("throws when teamName is blank", async () => {
    // @ts-expect-error - only the fields the code reads are needed
    getSession.mockResolvedValue({ user: { sub: "user-1", email: "a@b.com", name: "A" } });

    await expect(createSurveyAction(formDataFor("   "))).rejects.toThrow("Team name is required");
    expect(userUpsert).not.toHaveBeenCalled();
    expect(surveyCreate).not.toHaveBeenCalled();
  });

  it("upserts the user, creates the survey, and revalidates the dashboard", async () => {
    // @ts-expect-error - only the fields the code reads are needed
    getSession.mockResolvedValue({ user: { sub: "user-1", email: "a@b.com", name: "A" } });

    await createSurveyAction(formDataFor("Team A"));

    expect(userUpsert).toHaveBeenCalledWith({
      where: { id: "user-1" },
      update: { email: "a@b.com", name: "A" },
      create: { id: "user-1", email: "a@b.com", name: "A" },
    });
    expect(surveyCreate).toHaveBeenCalledWith({
      data: { userId: "user-1", teamName: "Team A" },
    });
    expect(revalidate).toHaveBeenCalledWith("/dashboard");
  });
});
