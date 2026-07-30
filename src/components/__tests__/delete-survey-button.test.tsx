import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/survey-actions", () => ({
  deleteSurveyAction: vi.fn(),
}));

import { deleteSurveyAction } from "@/lib/survey-actions";
import { DeleteSurveyButton } from "@/components/delete-survey-button";

const deleteAction = vi.mocked(deleteSurveyAction);

describe("DeleteSurveyButton", () => {
  let confirmSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    deleteAction.mockResolvedValue(undefined);
    confirmSpy = vi.spyOn(window, "confirm");
  });

  afterEach(() => {
    confirmSpy.mockRestore();
  });

  it("calls deleteSurveyAction when the user confirms", async () => {
    confirmSpy.mockReturnValue(true);
    const user = userEvent.setup();

    render(<DeleteSurveyButton surveyId="survey-1" teamName="Team A" />);
    await user.click(screen.getByRole("button", { name: /delete survey for team a/i }));

    expect(confirmSpy).toHaveBeenCalledWith(
      'Delete the survey for "Team A"? This cannot be undone.'
    );
    await waitFor(() => expect(deleteAction).toHaveBeenCalledWith("survey-1"));
  });

  it("does not call deleteSurveyAction when the user cancels", async () => {
    confirmSpy.mockReturnValue(false);
    const user = userEvent.setup();

    render(<DeleteSurveyButton surveyId="survey-1" teamName="Team A" />);
    await user.click(screen.getByRole("button", { name: /delete survey for team a/i }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteAction).not.toHaveBeenCalled();
  });
});
