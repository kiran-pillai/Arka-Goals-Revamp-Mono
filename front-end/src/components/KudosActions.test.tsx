import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import "@testing-library/jest-dom/vitest";
vi.mock("../lib/celebrations", async () => ({
  ...(await vi.importActual("../lib/celebrations")),
  useGiveKudos: vi.fn(),
  useKudosRecipients: vi.fn(),
}));
import { useGiveKudos, useKudosRecipients } from "../lib/celebrations";
import KudosActions from "./KudosActions";
import type { CheckIn } from "../checkin";
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
const mutate = vi.fn();
const checkIn = {
  id: "historical",
  createdAt: "2026-01-01T00:00:00Z",
  user: { email: "maya@example.com", firstName: "Maya" },
  kudosCount: 1,
  canGiveKudos: true,
  viewerHasGivenKudos: false,
} as CheckIn;
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.mocked(useGiveKudos).mockReturnValue({
    mutate,
    isPending: false,
    isError: false,
    isSuccess: false,
  } as unknown as ReturnType<typeof useGiveKudos>);
  vi.mocked(useKudosRecipients).mockReturnValue({
    data: [
      {
        id: "k1",
        createdAt: "",
        giver: { email: "alex@example.com", firstName: "Alex" },
      },
    ],
    isPending: false,
    isError: false,
  } as ReturnType<typeof useKudosRecipients>);
});
describe("Timeline kudos", () => {
  it("allows awards on a historical check-in", async () => {
    render(
      <MantineProvider env="test">
        <KudosActions checkIn={checkIn} />
      </MantineProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Give kudos" }));
    expect(mutate).toHaveBeenCalledWith("historical");
  });
  it("shows the recipient popover with the requested wording", async () => {
    render(
      <MantineProvider env="test">
        <KudosActions checkIn={checkIn} />
      </MantineProvider>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /See who gave kudos/ }),
    );
    expect(await screen.findByText("Alex")).toBeInTheDocument();
    expect(
      screen.getByText("1 person gave kudos to this check-in."),
    ).toBeInTheDocument();
  });
  it("keeps the count available on the viewer’s own check-in", () => {
    render(
      <MantineProvider env="test">
        <KudosActions checkIn={{ ...checkIn, canGiveKudos: false }} />
      </MantineProvider>,
    );
    expect(
      screen.queryByRole("button", { name: "Give kudos" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /See who gave kudos/ }),
    ).toBeEnabled();
  });
  it("does not invite self-awards in an own check-in's empty popover", async () => {
    vi.mocked(useKudosRecipients).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useKudosRecipients>);
    render(
      <MantineProvider env="test">
        <KudosActions
          checkIn={{ ...checkIn, canGiveKudos: false, kudosCount: 0 }}
        />
      </MantineProvider>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /See who gave kudos/ }),
    );
    expect(await screen.findByText("No kudos yet.")).toBeInTheDocument();
    expect(screen.queryByText(/Be the first/)).not.toBeInTheDocument();
    await userEvent.click(
      await screen.findByRole("button", { name: "Close kudos recipients" }),
    );
    expect(
      screen.getByRole("button", { name: /See who gave kudos/ }),
    ).toHaveAttribute("aria-expanded", "false");
  });
  it("invites awards on another member's empty check-in", async () => {
    vi.mocked(useKudosRecipients).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useKudosRecipients>);
    render(
      <MantineProvider env="test">
        <KudosActions checkIn={{ ...checkIn, kudosCount: 0 }} />
      </MantineProvider>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /See who gave kudos/ }),
    );
    expect(
      await screen.findByText("No kudos yet. Be the first to give kudos."),
    ).toBeInTheDocument();
  });
});
