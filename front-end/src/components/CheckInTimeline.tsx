import KudosActions from "./KudosActions";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Badge, Box, Group, Stack, Text, UnstyledButton } from "@mantine/core";
import {
  IconActivity,
  IconClock,
  IconThumbUp,
  IconThumbDown,
} from "@tabler/icons-react";
import type { CheckIn } from "../checkin";
import { getAvatarColor, getInitials } from "../lib/avatar-color";
import type { MentionUser } from "./CommentThread";
import CommentThread from "./CommentThread";
import CreatedTimestamp from "./CreatedTimestamp";

function getWeekSaturday(date: Date): Date {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  const saturday = new Date(
    Date.UTC(+parts.year, +parts.month - 1, +parts.day),
  );
  saturday.setUTCDate(saturday.getUTCDate() - ((saturday.getUTCDay() + 1) % 7));
  return saturday;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatWeekLabel(saturday: Date): string {
  const friday = new Date(saturday);
  friday.setUTCDate(saturday.getUTCDate() + 6);
  return `Week of ${formatDate(saturday)} – ${formatDate(friday)}`;
}

type WeekGroup = { label: string; items: CheckIn[] };

type Props = {
  users?: MentionUser[];
  targetCommentId?: string;
  targetId?: string;
  selectionKey?: string;
  onTargetArrival?: () => void;
  checkIns: CheckIn[];
  onAddComment: (
    checkInId: string,
    text: string,
    mentionedUserIds?: string[],
  ) => void;
  onDeleteComment: (checkInId: string, commentId: string) => void;
};

export default function CheckInTimeline({
  checkIns,
  onAddComment,
  onDeleteComment,
  targetId,
  targetCommentId,
  users,
  selectionKey,
  onTargetArrival,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const consumed = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (targetId && checkIns.some((c) => c.id === targetId)) {
      setExpanded((previous) => new Set([...previous, targetId]));
    }
  }, [targetId, selectionKey, checkIns]);
  useEffect(() => {
    if (!targetId) {
      consumed.current = undefined;
      return;
    }
    const key = selectionKey ?? targetId;
    if (!targetId || !expanded.has(targetId) || consumed.current === key)
      return;
    const element =
      (targetCommentId &&
        document.getElementById(`comment-${targetCommentId}`)) ||
      document.getElementById(`checkin-${targetId}`);
    if (!element) return;
    consumed.current = key;
    element.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
    element.focus({ preventScroll: true });
    onTargetArrival?.();
  }, [targetId, targetCommentId, selectionKey, expanded, onTargetArrival]);

  const weeks = useMemo(() => {
    const sorted = [...checkIns].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const groups: WeekGroup[] = [];
    let lastSaturdayTime: number | null = null;

    for (const c of sorted) {
      const saturday = c.reportingWeekStart
        ? new Date(c.reportingWeekStart)
        : getWeekSaturday(new Date(c.createdAt));
      const saturdayTime = saturday.getTime();

      if (lastSaturdayTime === null || saturdayTime !== lastSaturdayTime) {
        groups.push({ label: formatWeekLabel(saturday), items: [] });
        lastSaturdayTime = saturdayTime;
      }
      groups[groups.length - 1].items.push(c);
    }
    return groups;
  }, [checkIns]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Stack gap="xl">
      {weeks.map((week) => (
        <Box key={week.label}>
          <Text fw={700} c="arka" size="sm" mb="md">
            {week.label}
          </Text>

          <Stack gap="md" style={{ position: "relative", paddingLeft: 40 }}>
            <Box
              style={{
                position: "absolute",
                left: 18,
                top: 0,
                bottom: 0,
                width: 2,
                background: "var(--mantine-color-default-border)",
              }}
            />

            {week.items.map((c) => {
              const isExpanded = expanded.has(c.id);
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
              const commentCount = c.comments?.length ?? 0;

              return (
                <Box
                  key={c.id}
                  id={`checkin-${c.id}`}
                  tabIndex={-1}
                  style={{
                    position: "relative",
                    scrollMarginTop: 76,
                    outlineColor: "var(--mantine-color-arka-6)",
                  }}
                >
                  <Box
                    style={{
                      position: "absolute",
                      left: -40,
                      top: 18,
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: color,
                      border: "3px solid var(--mantine-color-body)",
                      boxShadow: `0 0 0 2px ${color}`,
                    }}
                  />

                  <Box
                    style={{
                      border: "1px solid var(--mantine-color-default-border)",
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    <UnstyledButton
                      data-testid="timeline-header"
                      onClick={() => toggle(c.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                        padding: "14px 16px",
                        width: "100%",
                      }}
                    >
                      <Box
                        data-testid="avatar"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 12,
                          color: "#fff",
                          flexShrink: 0,
                          backgroundColor: color,
                        }}
                      >
                        {initials}
                      </Box>

                      <Box style={{ flex: "1 1 160px", minWidth: 0 }}>
                        <Group gap={8}>
                          <Text fw={600} size="sm">
                            {name}
                          </Text>
                          {commentCount > 0 && (
                            <Badge
                              data-testid="comment-pill"
                              size="md"
                              variant="light"
                              color="blue"
                              radius={12}
                              fz={11}
                              fw={600}
                              px={10}
                              styles={{ section: { marginInlineEnd: 4 } }}
                              leftSection={
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                              }
                            >
                              {commentCount}
                            </Badge>
                          )}
                        </Group>
                        <CreatedTimestamp value={c.createdAt} />
                      </Box>

                      {c.timingStatus && (
                        <Badge
                          variant="light"
                          color={
                            c.timingStatus === "ON_TIME"
                              ? "teal"
                              : c.timingStatus === "LATE"
                                ? "orange"
                                : "gray"
                          }
                        >
                          {c.timingStatus === "ON_TIME"
                            ? "On time"
                            : c.timingStatus === "LATE"
                              ? "Late"
                              : "Timing unavailable"}
                        </Badge>
                      )}
                      {c.rating != null && (
                        <Badge variant="light" color="arka">
                          Rating: {c.rating}/5
                        </Badge>
                      )}
                      <Badge
                        color={c.completedGoal ? "teal" : "red"}
                        variant="light"
                      >
                        {c.completedGoal ? "Goal met" : "Not met"}
                      </Badge>
                    </UnstyledButton>

                    {c.kudosCount !== undefined && <KudosActions checkIn={c} />}
                    {isExpanded && (
                      <Box p="md" pt={0}>
                        <Stack gap="sm">
                          <FieldRow
                            icon={<IconActivity size={16} />}
                            label="Results Related to Goal"
                            value={c.results}
                          />
                          <FieldRow
                            icon={<IconClock size={16} />}
                            label="Committing to This Week"
                            value={c.commitments}
                          />
                          <FieldRow
                            icon={<IconThumbUp size={16} />}
                            label="What Went Well"
                            value={c.wins}
                          />
                          <FieldRow
                            icon={<IconThumbDown size={16} />}
                            label="What Did Not Go Well"
                            value={c.frictions}
                          />
                        </Stack>

                        <Box mt="md">
                          <CommentThread
                            users={users}
                            comments={c.comments ?? []}
                            onAddComment={(text, ids) =>
                              onAddComment(c.id, text, ids)
                            }
                            onDeleteComment={(commentId) =>
                              onDeleteComment(c.id, commentId)
                            }
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

function FieldRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Group gap={8} align="flex-start" wrap="nowrap">
      <Box c="dimmed" style={{ flexShrink: 0, marginTop: 1 }}>
        {icon}
      </Box>
      <Box style={{ flex: 1 }}>
        <Text
          fw={700}
          tt="uppercase"
          c="dimmed"
          style={{ fontSize: 11, letterSpacing: 0.4 }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 13,
            marginTop: 2,
            whiteSpace: "pre-wrap",
            color: "var(--mantine-color-text)",
          }}
        >
          {value}
        </Text>
      </Box>
    </Group>
  );
}
