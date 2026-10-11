import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import "@testing-library/jest-dom/vitest";
import NotificationInbox from "./NotificationInbox";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  read: vi.fn(),
  readAll: vi.fn(),
  refetch: vi.fn(),
  count: 2,
}));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
}));
vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({ user: { id: "owner", email: "anon@example.com" } }),
}));
vi.mock("../lib/notifications", () => ({
  useInbox: () => ({
    data: {
      pages: [
        {
          unreadCount: mocks.count,
          snapshot: "snapshot",
          items: [
            {
              kind: "MENTION",
              commentId: "comment",
              id: "notification",
              checkInId: "checkin",
              checkInDate: "2026-10-01",
              createdAt: "2026-10-10",
              readAt: null,
              actor: {
                firstName: "Anthony",
                lastName: "Wilson",
                email: "anthony@example.com",
              },
            },
          ],
        },
      ],
    },
    refetch: mocks.refetch,
    isPending: false,
    isError: false,
  }),
  useReadNotification: () => ({ mutate: mocks.read }),
  useReadAllNotifications: () => ({ mutate: mocks.readAll }),
}));
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn(() => ({
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

describe("NotificationInbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.count = 2;
  });
  const setup = () => {
    const user = userEvent.setup();
    render(
      <MantineProvider>
        <NotificationInbox />
      </MantineProvider>,
    );
    return user;
  };
  it("opens from the email-initial avatar without marking notifications read", async () => {
    const user = setup();
    expect(screen.getByText("AN")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Notifications, 2 unread" }),
    );
    expect(await screen.findByText("Anthony Wilson")).toBeInTheDocument();
    expect(mocks.refetch).toHaveBeenCalled();
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it("marks an item read without navigating", async () => {
    const user = setup();
    await user.click(
      screen.getByRole("button", { name: "Notifications, 2 unread" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Mark notification as read" }),
    );
    expect(mocks.read).toHaveBeenCalledWith("notification");
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it("routes selection to the check-in without acknowledging before arrival", async () => {
    const user = setup();
    await user.click(
      screen.getByRole("button", { name: "Notifications, 2 unread" }),
    );
    await user.click(await screen.findByText("Anthony Wilson"));
    expect(mocks.navigate).toHaveBeenCalledWith({
      to: "/",
      search: {
        checkInId: "checkin",
        notificationId: "notification",
        commentId: "comment",
      },
    });
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it("marks all through the server-issued snapshot", async () => {
    const user = setup();
    await user.click(
      screen.getByRole("button", { name: "Notifications, 2 unread" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Mark all read" }),
    );
    expect(mocks.readAll).toHaveBeenCalledWith("snapshot");
  });
  it("caps the visible badge while preserving the accessible count and restores focus on Escape", async () => {
    mocks.count = 120;
    const user = setup();
    const avatar = screen.getByRole("button", {
      name: "Notifications, 120 unread",
    });
    expect(screen.getByText("99+")).toBeInTheDocument();
    await user.click(avatar);
    await screen.findByText("Anthony Wilson");
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(avatar).toHaveAttribute("aria-expanded", "false"),
    );
    await waitFor(() => expect(avatar).toHaveFocus());
  });
});
