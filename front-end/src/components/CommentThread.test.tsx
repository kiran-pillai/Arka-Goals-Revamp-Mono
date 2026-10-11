import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import "@testing-library/jest-dom/vitest";

// Polyfill browser APIs for jsdom (needed by Mantine)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Mock Mantine Textarea to avoid autosize crash in jsdom
vi.mock("@mantine/core", async () => {
  const actual =
    await vi.importActual<typeof import("@mantine/core")>("@mantine/core");
  return {
    ...actual,
    Textarea: (props: any) => (
      <textarea
        placeholder={props.placeholder}
        value={props.value}
        onChange={props.onChange}
        onKeyDown={props.onKeyDown}
        onSelect={props.onSelect}
        onBlur={props.onBlur}
        onFocus={props.onFocus}
        ref={props.ref}
        rows={props.minRows ?? 1}
      />
    ),
  };
});

import CommentThread from "./CommentThread";
import type { MentionUser } from "./CommentThread";
import type { Comment } from "../checkin";

const COMMENTS: Comment[] = [
  {
    id: "cm1",
    text: "That 12% lift is amazing!",
    createdAt: "2026-10-01T14:00:00Z",
    user: {
      email: "marcus@ex.com",
      firstName: "Marcus",
      lastName: "Johnson",
      colorSlot: 1,
    },
  },
  {
    id: "cm2",
    text: "I hit the same CI issue.",
    createdAt: "2026-10-01T15:00:00Z",
    user: {
      email: "alex@ex.com",
      firstName: "Alex",
      lastName: "Rivera",
      colorSlot: 3,
    },
  },
];

function renderThread(
  props: Partial<{
    users: MentionUser[];
    comments: Comment[];
    onAddComment: (text: string) => void;
    onDeleteComment: (id: string) => void;
  }> = {},
) {
  const defaultProps = {
    comments: COMMENTS,
    onAddComment: vi.fn(),
    onDeleteComment: vi.fn(),
  };
  return {
    ...render(
      <MantineProvider>
        <CommentThread {...defaultProps} {...props} />
      </MantineProvider>,
    ),
    onAddComment: props.onAddComment ?? defaultProps.onAddComment,
    onDeleteComment: props.onDeleteComment ?? defaultProps.onDeleteComment,
  };
}

describe("CommentThread", () => {
  it("renders existing comments with author name and text", () => {
    renderThread();

    expect(screen.getByText("Marcus Johnson")).toBeInTheDocument();
    expect(screen.getByText("That 12% lift is amazing!")).toBeInTheDocument();
    expect(screen.getByText("Alex Rivera")).toBeInTheDocument();
    expect(screen.getByText("I hit the same CI issue.")).toBeInTheDocument();
  });

  it("renders comment avatars with author initials", () => {
    renderThread();

    expect(screen.getByText("MJ")).toBeInTheDocument();
    expect(screen.getByText("AR")).toBeInTheDocument();
  });

  it("maps comment avatar color from colorSlot to AVATAR_COLOR_POOL", () => {
    const { container } = renderThread();

    const avatars = container.querySelectorAll(
      '[data-testid="comment-avatar"]',
    );
    expect(avatars.length).toBe(2);

    // Marcus has colorSlot 1 -> AVATAR_COLOR_POOL[1] is '#228be6' — jsdom normalizes to rgb
    const marcusAvatar = avatars[0] as HTMLElement;
    expect(marcusAvatar.style.backgroundColor).toBe("rgb(34, 139, 230)");
  });

  it("has a text input and send button", () => {
    renderThread();

    expect(screen.getByPlaceholderText(/add a comment/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("calls onAddComment with text when send is clicked", async () => {
    const user = userEvent.setup();
    const onAddComment = vi.fn();
    renderThread({ onAddComment });

    const input = screen.getByPlaceholderText(/add a comment/i);
    await user.type(input, "Great work!");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(onAddComment).toHaveBeenCalledWith("Great work!");
  });

  it("clears the input after sending", async () => {
    const user = userEvent.setup();
    renderThread();

    const input = screen.getByPlaceholderText(
      /add a comment/i,
    ) as HTMLTextAreaElement;
    await user.type(input, "Great work!");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(input.value).toBe("");
  });

  it("submits on Enter without shift", async () => {
    const user = userEvent.setup();
    const onAddComment = vi.fn();
    renderThread({ onAddComment });

    const input = screen.getByPlaceholderText(/add a comment/i);
    await user.type(input, "Quick note");
    await user.keyboard("{Enter}");

    expect(onAddComment).toHaveBeenCalledWith("Quick note");
  });

  it("does not submit on Shift+Enter (allows newline)", async () => {
    const user = userEvent.setup();
    const onAddComment = vi.fn();
    renderThread({ onAddComment });

    const input = screen.getByPlaceholderText(/add a comment/i);
    await user.type(input, "Line one");
    await user.keyboard("{Shift>}{Enter}{/Shift}");

    expect(onAddComment).not.toHaveBeenCalled();
  });

  it("does not submit when input is empty", async () => {
    const user = userEvent.setup();
    const onAddComment = vi.fn();
    renderThread({ onAddComment });

    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(onAddComment).not.toHaveBeenCalled();
  });

  it("shows empty state when no comments exist", () => {
    renderThread({ comments: [] });

    expect(screen.getByText(/no comments/i)).toBeInTheDocument();
  });
});

describe("comment mentions", () => {
  const users = [
    { id: "anthony", firstName: "Anthony", lastName: "Wilson" },
    { id: "alex", firstName: "Alex", lastName: null },
    { id: "another", firstName: "Anthony", lastName: "Wilson" },
  ];
  it("highlights submitted full-name and first-name mentions in the primary color", () => {
    const text =
      "Thanks @Anthony Wilson, and @Alex!\n@Nobody foo@Alex @Alexandra";
    renderThread({ users, comments: [{ ...COMMENTS[0], text }] });
    for (const label of ["@Anthony Wilson", "@Alex"]) {
      expect(screen.getByText(label)).toHaveStyle({
        color: "var(--mantine-primary-color-filled)",
      });
    }
    expect(screen.getByText("@Alex").parentElement).toHaveTextContent(
      "@Nobody foo@Alex @Alexandra",
    );
    expect(
      screen.getByText("@Alex").parentElement?.querySelectorAll("span"),
    ).toHaveLength(2);
  });
  it("selects the highlighted mention with Tab and keeps focus in the comment", async () => {
    const user = userEvent.setup();
    const onAddComment = vi.fn();
    renderThread({ users, onAddComment });
    const input = screen.getByPlaceholderText(/add a comment/i);
    await user.type(input, "Thanks @");
    await user.keyboard("{ArrowDown}");
    await user.tab();
    expect(input).toHaveValue("Thanks @Alex ");
    expect(input).toHaveFocus();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onAddComment).not.toHaveBeenCalled();
    await user.tab();
    expect(screen.getByRole("button", { name: /send/i })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(onAddComment).toHaveBeenCalledWith("Thanks @Alex", ["alex"]);
  });
  it("filters full names and selects with the keyboard without submitting", async () => {
    const user = userEvent.setup();
    const onAddComment = vi.fn();
    renderThread({ users, onAddComment });
    const input = screen.getByPlaceholderText(/add a comment/i);
    await user.type(input, "Thanks @Alex");
    expect(screen.getByRole("option", { name: "Alex" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Anthony Wilson" }),
    ).not.toBeInTheDocument();
    await user.keyboard("{Enter}");
    expect(onAddComment).not.toHaveBeenCalled();
    expect(input).toHaveValue("Thanks @Alex ");
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(onAddComment).toHaveBeenCalledWith("Thanks @Alex", ["alex"]);
  });
  it("hides unmatched results and does not notify incidental names", async () => {
    const user = userEvent.setup();
    const onAddComment = vi.fn();
    renderThread({ users, onAddComment });
    await user.type(
      screen.getByPlaceholderText(/add a comment/i),
      "@Nobody and Alex",
    );
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(onAddComment).toHaveBeenCalledWith("@Nobody and Alex");
  });
  it("keeps selected identity for identical names and deduplicates repeated selections", async () => {
    const user = userEvent.setup();
    const onAddComment = vi.fn();
    renderThread({ users, onAddComment });
    await user.type(screen.getByPlaceholderText(/add a comment/i), "@Anthony");
    await user.keyboard("{ArrowDown}{Enter}");
    await user.keyboard("@Anthony");
    await user.keyboard("{ArrowDown}{Enter}");
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(onAddComment).toHaveBeenCalledWith(
      "@Anthony Wilson @Anthony Wilson",
      ["another"],
    );
  });
  it("removes selected IDs when the selected token is edited away", async () => {
    const user = userEvent.setup();
    const onAddComment = vi.fn();
    renderThread({ users, onAddComment });
    const input = screen.getByPlaceholderText(/add a comment/i);
    await user.type(input, "@Alex");
    await user.keyboard("{Enter}");
    await user.clear(input);
    await user.type(input, "Hello");
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(onAddComment).toHaveBeenCalledWith("Hello");
  });
});

it("preserves a selected mention when text is inserted before it", async () => {
  const user = userEvent.setup();
  const onAddComment = vi.fn();
  renderThread({
    users: [{ id: "alex", firstName: "Alex", lastName: null }],
    onAddComment,
  });
  const input = screen.getByPlaceholderText(
    /add a comment/i,
  ) as HTMLTextAreaElement;
  await user.type(input, "@Alex");
  await user.keyboard("{Enter}");
  input.setSelectionRange(0, 0);
  await user.keyboard("Thanks ");
  await user.click(screen.getByRole("button", { name: /send/i }));
  expect(onAddComment).toHaveBeenCalledWith("Thanks @Alex", ["alex"]);
});
