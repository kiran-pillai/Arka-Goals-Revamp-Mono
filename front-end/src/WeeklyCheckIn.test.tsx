import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import "@testing-library/jest-dom/vitest";
import { ApiError } from "./lib/api";
import { useCreateCheckIn } from "./lib/checkins";
import WeeklyCheckIn from "./WeeklyCheckIn";

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("./lib/checkins", () => ({ useCreateCheckIn: vi.fn() }));
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});
Object.defineProperty(document, "fonts", {
  configurable: true,
  value: { addEventListener: vi.fn(), removeEventListener: vi.fn() },
});
afterEach(cleanup);

describe("WeeklyCheckIn submission errors", () => {
  it.each([
    [
      new ApiError(
        409,
        "You have already submitted a check-in for this reporting week.",
      ),
      "You have already submitted a check-in for this reporting week.",
    ],
    [
      new TypeError("Failed to fetch"),
      "Couldn’t save your check-in. Please try again.",
    ],
    [new ApiError(500, ""), "Couldn’t save your check-in. Please try again."],
  ])("shows an actionable message for %s", (error, message) => {
    vi.mocked(useCreateCheckIn).mockReturnValue({
      isError: true,
      error,
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useCreateCheckIn>);
    render(
      <MantineProvider env="test">
        <WeeklyCheckIn />
      </MantineProvider>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(
      screen.getByRole("button", { name: "Submit check-in" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Check-in submitted")).not.toBeInTheDocument();
  });
});
