import { useId, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Box,
  Button,
  Group,
  Stack,
  Text,
  Textarea,
  UnstyledButton,
} from "@mantine/core";
import type { Comment } from "../checkin";
import { getAvatarColor, getInitials } from "../lib/avatar-color";
import CreatedTimestamp from "./CreatedTimestamp";

export type MentionUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
};
type Mention = { id: string; start: number; end: number };
const fullName = (user: MentionUser) =>
  [user.firstName, user.lastName].filter(Boolean).join(" ");

function highlightMentions(text: string, users: MentionUser[]): ReactNode[] {
  const names = [...new Set(users.map(fullName).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(/(?:^|\s)@/gu)) {
    const start = match.index + match[0].length - 1;
    if (start < cursor) continue;
    const name = names.find(
      (name) =>
        text.startsWith(`@${name}`, start) &&
        !/^[\p{L}\p{N}_]/u.test(text.slice(start + name.length + 1)),
    );
    if (!name) continue;
    parts.push(text.slice(cursor, start));
    cursor = start + name.length + 1;
    parts.push(
      <Text
        key={start}
        component="span"
        inherit
        fw={600}
        style={{ color: "var(--mantine-primary-color-filled)" }}
      >
        {text.slice(start, cursor)}
      </Text>,
    );
  }
  parts.push(text.slice(cursor));
  return parts;
}

type Props = {
  users?: MentionUser[];
  comments: Comment[];
  onAddComment: (text: string, mentionedUserIds?: string[]) => void;
  onDeleteComment: (id: string) => void;
};

export default function CommentThread({
  comments,
  onAddComment,
  users = [],
}: Props) {
  const [text, setText] = useState("");
  const optionsId = useId();
  const pendingCaret = useRef<number | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    if (pendingCaret.current !== null) {
      input.current?.focus();
      input.current?.setSelectionRange(
        pendingCaret.current,
        pendingCaret.current,
      );
      pendingCaret.current = null;
    }
  }, [text]);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [caret, setCaret] = useState(0);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const match = text.slice(0, caret).match(/(?:^|\s)@([^@\n]*)$/);
  const start = match ? caret - match[1].length - 1 : -1;
  const options =
    !dismissed &&
    match &&
    !mentions.some((m) => start >= m.start && start < m.end)
      ? users.filter(
          (user) =>
            fullName(user) &&
            fullName(user).toLowerCase().includes(match[1].toLowerCase()),
        )
      : [];
  const updateText = (next: string, position: number) => {
    let prefix = 0;
    while (
      prefix < text.length &&
      prefix < next.length &&
      text[prefix] === next[prefix]
    )
      prefix++;
    let suffix = 0;
    while (
      suffix < text.length - prefix &&
      suffix < next.length - prefix &&
      text[text.length - 1 - suffix] === next[next.length - 1 - suffix]
    )
      suffix++;
    const end = text.length - suffix;
    const delta = next.length - text.length;
    setMentions((previous) =>
      previous.flatMap((mention) => {
        if (mention.end <= prefix) return [mention];
        if (mention.start >= end)
          return [
            {
              ...mention,
              start: mention.start + delta,
              end: mention.end + delta,
            },
          ];
        return [];
      }),
    );
    setText(next);
    setCaret(position);
    setActive(0);
    setDismissed(false);
  };
  const select = (user: MentionUser) => {
    const label = "@" + fullName(user);
    const next = text.slice(0, start) + label + " " + text.slice(caret);
    const delta = label.length + 1 - (caret - start);
    setMentions((previous) => [
      ...previous
        .filter((m) => m.end <= start || m.start >= caret)
        .map((m) =>
          m.start >= caret
            ? { ...m, start: m.start + delta, end: m.end + delta }
            : m,
        ),
      { id: user.id, start, end: start + label.length },
    ]);
    pendingCaret.current = start + label.length + 1;
    setText(next);
    setCaret(start + label.length + 1);
    setDismissed(true);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const ids = [...new Set(mentions.map((m) => m.id))];
    if (ids.length) onAddComment(trimmed, ids);
    else onAddComment(trimmed);
    setMentions([]);
    setText("");
    setCaret(0);
    setActive(0);
    setDismissed(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      options.length &&
      ["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(e.key) &&
      !e.shiftKey
    ) {
      e.preventDefault();
      if (e.key === "Escape") setDismissed(true);
      else if (e.key === "Enter" || e.key === "Tab")
        select(options[active % options.length]);
      else
        setActive(
          (previous) =>
            (previous + (e.key === "ArrowDown" ? 1 : options.length - 1)) %
            options.length,
        );
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Stack gap="sm">
      {comments.length === 0 ? (
        <Text size="sm" c="dimmed">
          No comments yet
        </Text>
      ) : (
        comments.map((c) => {
          const color = getAvatarColor(c.user.colorSlot);
          const initials = getInitials(
            c.user.firstName,
            c.user.lastName,
            c.user.email,
          );
          const name =
            c.user.firstName && c.user.lastName
              ? `${c.user.firstName} ${c.user.lastName}`
              : c.user.email;

          return (
            <Group
              id={`comment-${c.id}`}
              tabIndex={-1}
              style={{ scrollMarginTop: 76 }}
              key={c.id}
              gap="sm"
              align="flex-start"
              wrap="nowrap"
            >
              <Box
                data-testid="comment-avatar"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 11,
                  color: "#fff",
                  flexShrink: 0,
                  backgroundColor: color,
                }}
              >
                {initials}
              </Box>

              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={600}>
                  {name}
                </Text>
                <CreatedTimestamp value={c.createdAt} />
                <Text size="sm" fw={400} style={{ whiteSpace: "pre-wrap" }}>
                  {highlightMentions(c.text, users)}
                </Text>
              </Box>
            </Group>
          );
        })
      )}

      <Group gap="sm" align="flex-start">
        <Box style={{ flex: 1, minWidth: 0, position: "relative" }}>
          <Textarea
            ref={input}
            aria-label="Add a comment"
            aria-controls={options.length ? optionsId : undefined}
            aria-activedescendant={
              options.length
                ? `${optionsId}-${options[active % options.length].id}`
                : undefined
            }
            aria-expanded={options.length > 0}
            onBlur={() => setDismissed(true)}
            onFocus={() => setDismissed(false)}
            onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
            placeholder="Add a comment..."
            value={text}
            onChange={(e) =>
              updateText(e.currentTarget.value, e.currentTarget.selectionStart)
            }
            onKeyDown={handleKeyDown}
            autosize
            minRows={1}
            style={{ flex: 1 }}
          />
          {options.length > 0 && (
            <Stack
              id={optionsId}
              role="listbox"
              aria-label="Mention a user"
              gap={0}
              p="xs"
              style={{
                position: "absolute",
                bottom: "100%",
                width: "100%",
                maxHeight: 220,
                overflowY: "auto",
                background: "var(--mantine-color-body)",
                border: "1px solid var(--mantine-color-default-border)",
                borderRadius: 8,
                zIndex: 10,
              }}
            >
              {options.map((user, index) => (
                <UnstyledButton
                  key={user.id}
                  id={`${optionsId}-${user.id}`}
                  role="option"
                  aria-selected={index === active % options.length}
                  p="xs"
                  style={{
                    background:
                      index === active % options.length
                        ? "var(--mantine-color-arka-light)"
                        : undefined,
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(user)}
                >
                  {fullName(user)}
                </UnstyledButton>
              ))}
            </Stack>
          )}
        </Box>
        <Button onClick={handleSend}>Send</Button>
      </Group>
    </Stack>
  );
}
