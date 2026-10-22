import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import "@testing-library/jest-dom/vitest";
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("./auth/AuthContext", () => ({
  useAuth: () => ({ user: { id: "me" } }),
}));
vi.mock("./lib/celebrations", async () => ({
  ...(await vi.importActual("./lib/celebrations")),
  useDashboard: vi.fn(),
  useLeaderboard: vi.fn(),
}));
import { useDashboard, useLeaderboard } from "./lib/celebrations";
import { DashboardPage, LeaderboardPage } from "./CelebrationsPages";
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi
    .fn()
    .mockImplementation(() => ({
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
const dashboard = {
  kudosReceived: 0,
  totalSubmissions: 0,
  onTimeSubmissions: 0,
  unknownTimingSubmissions: 0,
  rank: null,
  tied: false,
  recentRecognition: [],
  recentCheckIns: [],
};
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe("Celebrations screens", () => {
  it("hides recent recognition entirely when there are no kudos", () => {
    vi.mocked(useDashboard).mockReturnValue({
      data: dashboard,
      isPending: false,
      isError: false,
    } as ReturnType<typeof useDashboard>);
    render(
      <MantineProvider>
        <DashboardPage />
      </MantineProvider>,
    );
    expect(screen.queryByText("Recent recognition")).not.toBeInTheDocument();
    expect(
      screen.getByText("Your first check-in starts the story"),
    ).toBeInTheDocument();
    expect(screen.getByText("0 total submissions")).toBeInTheDocument();
  });
  it("shows counts and ties without rates", () => {
    vi.mocked(useLeaderboard).mockReturnValue({
      data: [
        {
          id: "me",
          email: "me@example.com",
          firstName: "Kiran",
          rank: 3,
          tied: true,
          totalSubmissions: 12,
          onTimeSubmissions: 10,
        },
      ],
      isPending: false,
      isError: false,
    } as ReturnType<typeof useLeaderboard>);
    render(
      <MantineProvider>
        <LeaderboardPage />
      </MantineProvider>,
    );
    expect(screen.getByText("Tied")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});
