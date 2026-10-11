import { useMemo, useState } from "react";
import {
  Accordion,
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconTargetArrow } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { useGoals, useUpdateGoal } from "./lib/goals";
import { useAuth } from "./auth/AuthContext";
import type { FrequencyPeriod, Goal } from "./goal";
import { getInitials } from "./lib/avatar-color";
import "./GoalsTable.css";

const statusColor: Record<string, string> = {
  ACTIVE: "blue",
  COMPLETED: "teal",
  FAILED: "red",
  CANCELLED: "gray",
};

const periodLabel: Record<FrequencyPeriod, string> = {
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  QUARTER: "quarter",
};

/** Which statuses the list shows. Defaults to `active` so finished goals don't pile up. */
type StatusFilter = "active" | "completed" | "all";

const SAVE_FALLBACK = "Couldn't save that change. Please try again.";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Use every available name part without exposing email on the card. */
function memberName(user: Goal["user"]): string {
  return (
    [user.firstName, user.lastName]
      .map((name) => name?.trim())
      .filter(Boolean)
      .join(" ") || "Member"
  );
}

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : SAVE_FALLBACK;
}

function matchesFilter(g: Goal, filter: StatusFilter): boolean {
  if (filter === "active") return g.status === "ACTIVE";
  if (filter === "completed") return g.status === "COMPLETED";
  return true;
}

export default function GoalsTable() {
  const [scope, setScope] = useState<"mine" | "squad">("mine");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [nameFilter, setNameFilter] = useState("");
  const nameQuery =
    scope === "squad" ? nameFilter.trim().toLocaleLowerCase() : "";
  const goals = useGoals(scope === "mine");
  const navigate = useNavigate();
  const { user } = useAuth();
  const updateGoal = useUpdateGoal();

  /** The goal awaiting "Mark complete" confirmation, if any. */
  const [confirming, setConfirming] = useState<Goal | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  /**
   * Reopen has no dialog to hold an error, so a failure is shown on the card
   * it came from. Keyed by goal id because the squad view renders many cards.
   */
  const [reopenError, setReopenError] = useState<{
    id: string;
    message: string;
  } | null>(null);
  /** Goal id with a save in flight, used to put the right button in a loading state. */
  const [savingId, setSavingId] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      (goals.data ?? []).filter(
        (g) =>
          matchesFilter(g, statusFilter) &&
          memberName(g.user).toLocaleLowerCase().includes(nameQuery),
      ),
    [goals.data, statusFilter, nameQuery],
  );

  /** Everything fetched for this scope, before the status filter narrows it. */
  const totalCount = goals.data?.length ?? 0;

  // Auth resolves before this screen renders, but stay null-safe: with no known
  // current user we render no per-goal actions rather than guessing ownership.
  const currentUserId = user?.id ?? null;

  function openConfirm(g: Goal) {
    setConfirmError(null);
    setConfirming(g);
  }

  function closeConfirm() {
    setConfirming(null);
    setConfirmError(null);
  }

  function confirmComplete() {
    if (!confirming) return;
    const id = confirming.id;
    setConfirmError(null);
    setSavingId(id);
    updateGoal.mutate(
      { id, status: "COMPLETED" },
      {
        // Keep the dialog open on failure so the reason is actually seen.
        onSuccess: () => setConfirming(null),
        onError: (err) => setConfirmError(errorMessage(err)),
        onSettled: () => setSavingId(null),
      },
    );
  }

  /** Reopening is harmless, so it saves straight away with no confirmation. */
  function reopen(g: Goal) {
    setReopenError(null);
    setSavingId(g.id);
    updateGoal.mutate(
      { id: g.id, status: "ACTIVE" },
      {
        onError: (err) =>
          setReopenError({ id: g.id, message: errorMessage(err) }),
        onSettled: () => setSavingId(null),
      },
    );
  }

  return (
    <>
      <Stack gap="sm" mb="md">
        <Group justify="space-between" align="flex-end">
          <Title order={1} fz={30}>
            Goals
          </Title>
          <Button color="arka" onClick={() => navigate({ to: "/goals/new" })}>
            Add a goal
          </Button>
        </Group>

        <Group gap="sm" wrap="wrap">
          <SegmentedControl
            value={scope}
            onChange={(v) => setScope(v as "mine" | "squad")}
            data={[
              { label: "My goals", value: "mine" },
              { label: "Whole squad", value: "squad" },
            ]}
            color="arka"
          />

          <SegmentedControl
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
            data={[
              { label: "Active", value: "active" },
              { label: "Completed", value: "completed" },
              { label: "All", value: "all" },
            ]}
            color="arka"
          />
        </Group>
        {scope === "squad" && (
          <TextInput
            label="Filter by name"
            placeholder="Search squad members"
            value={nameFilter}
            onChange={(event) => setNameFilter(event.currentTarget.value)}
          />
        )}
      </Stack>

      {goals.isLoading ? (
        <Stack align="center" py="xl">
          <Text c="dimmed">Loading…</Text>
        </Stack>
      ) : rows.length === 0 ? (
        <Stack align="center" gap={4} py="xl">
          {totalCount === 0 ? (
            <>
              <Text fw={600}>No goals yet</Text>
              <Text c="dimmed" size="sm">
                Set a goal and it'll show up here.
              </Text>
            </>
          ) : nameQuery ? (
            <>
              <Text fw={600}>No matching goals</Text>
              <Text c="dimmed" size="sm">
                Try another name or change the status filter.
              </Text>
              <Button variant="subtle" onClick={() => setNameFilter("")}>
                Clear name filter
              </Button>
            </>
          ) : (
            <>
              <Text fw={600}>
                {statusFilter === "active"
                  ? "No active goals"
                  : "No completed goals"}
              </Text>
              <Text c="dimmed" size="sm">
                {totalCount === 1
                  ? "There is 1 goal with a different status — switch the filter to see it."
                  : `There are ${totalCount} goals with a different status — switch the filter to see them.`}
              </Text>
            </>
          )}
        </Stack>
      ) : (
        <Stack gap="sm">
          {rows.map((g) => {
            const isOwn = currentUserId !== null && g.userId === currentUserId;
            const isCompleted = g.status === "COMPLETED";
            const isSaving = savingId === g.id;
            const failed = reopenError?.id === g.id;

            return (
              <Card
                key={g.id}
                withBorder
                radius="md"
                padding={0}
                className="goal-card"
                data-tone={
                  isCompleted
                    ? "purple"
                    : g.measureType === "HABIT_PROCESS"
                      ? "teal"
                      : "amber"
                }
              >
                <div className="goal-card-rail">
                  <IconTargetArrow size={24} stroke={1.6} aria-hidden="true" />
                  <div className="goal-card-rail-measure">
                    <span className="goal-card-rail-value">
                      {g.measureType === "HABIT_PROCESS"
                        ? g.frequencyCount != null
                          ? `${g.frequencyCount}×`
                          : "—"
                        : g.targetValue != null
                          ? g.targetValue
                          : "✓"}
                    </span>
                    <span className="goal-card-rail-label">
                      {g.measureType === "HABIT_PROCESS"
                        ? g.frequencyPeriod
                          ? `every ${periodLabel[g.frequencyPeriod]}`
                          : "Habit"
                        : g.targetValue != null
                          ? "target"
                          : "Pass/fail"}
                    </span>
                  </div>
                </div>
                <Stack gap={6} className="goal-card-body">
                  <Group justify="space-between" gap="sm" wrap="wrap">
                    <Text className="goal-card-kind">
                      {g.measureType === "HABIT_PROCESS"
                        ? "Habit / process"
                        : "Outcome"}
                    </Text>
                    <Badge
                      color={statusColor[g.status] ?? "gray"}
                      variant="light"
                      fw={650}
                    >
                      {g.status}
                    </Badge>
                  </Group>
                  <Text className="goal-card-title">{g.title}</Text>

                  {g.description &&
                    (g.description.length > 2000 ? (
                      <Accordion variant="contained" radius="md">
                        <Accordion.Item value="description">
                          <Accordion.Control>
                            Read full goal description
                          </Accordion.Control>
                          <Accordion.Panel>
                            <Text
                              className="goal-card-description"
                              style={{
                                whiteSpace: "pre-wrap",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {g.description}
                            </Text>
                          </Accordion.Panel>
                        </Accordion.Item>
                      </Accordion>
                    ) : (
                      <Text
                        className="goal-card-description"
                        style={{
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {g.description}
                      </Text>
                    ))}

                  <Group
                    className="goal-card-footer"
                    justify="space-between"
                    gap="sm"
                    wrap="wrap"
                  >
                    <Group gap={6} className="goal-card-member" wrap="nowrap">
                      <Avatar
                        size={22}
                        radius="xl"
                        className="goal-card-avatar"
                      >
                        {getInitials(
                          g.user.firstName,
                          g.user.lastName,
                          g.user.email,
                        )}
                      </Avatar>
                      <Text className="goal-card-member-details">
                        <span className="goal-card-member-name">
                          {memberName(g.user)}
                        </span>
                        <span className="goal-card-date">
                          {` · Created ${formatDate(g.createdAt)}`}
                          {isCompleted &&
                            ` · Completed ${g.completedAt ? formatDate(g.completedAt) : "—"}`}
                        </span>
                      </Text>
                    </Group>
                    <Group gap="xs">
                      {/* No action at all on someone else's goal: the server
                          masks an ownership failure as a 404, so a disabled
                          button would only promise something that can't work. */}
                      {isOwn && g.status === "ACTIVE" && (
                        <Button
                          size="xs"
                          variant="filled"
                          className="goal-card-action"
                          loading={isSaving}
                          onClick={() => openConfirm(g)}
                        >
                          Mark complete
                        </Button>
                      )}
                      {isOwn && isCompleted && (
                        <Button
                          size="xs"
                          variant="filled"
                          className="goal-card-action"
                          loading={isSaving}
                          onClick={() => reopen(g)}
                        >
                          Reopen
                        </Button>
                      )}
                    </Group>
                  </Group>

                  {failed && reopenError && (
                    <Alert color="red" variant="light">
                      {reopenError.message}
                    </Alert>
                  )}
                </Stack>
              </Card>
            );
          })}
        </Stack>
      )}

      <Modal
        opened={confirming !== null}
        onClose={closeConfirm}
        title="Mark this goal complete?"
        centered
      >
        {confirming && (
          <Stack gap="md">
            <Text size="sm">
              “{confirming.title}” will be marked complete and will show as
              completed to the squad. You can reopen it later.
            </Text>

            {confirmError && (
              <Alert color="red" variant="light">
                {confirmError}
              </Alert>
            )}

            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={closeConfirm}
                disabled={savingId === confirming.id}
              >
                Cancel
              </Button>
              <Button
                color="arka"
                loading={savingId === confirming.id}
                onClick={confirmComplete}
              >
                Mark complete
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
