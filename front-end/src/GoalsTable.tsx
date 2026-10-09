import { useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useNavigate } from '@tanstack/react-router'
import { useGoals, useUpdateGoal } from './lib/goals'
import { useAuth } from './auth/AuthContext'
import type { FrequencyPeriod, Goal } from './goal'

const statusColor: Record<string, string> = {
  ACTIVE: 'blue',
  COMPLETED: 'teal',
  FAILED: 'red',
  CANCELLED: 'gray',
}

const periodLabel: Record<FrequencyPeriod, string> = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
}

/** Which statuses the list shows. Defaults to `active` so finished goals don't pile up. */
type StatusFilter = 'active' | 'completed' | 'all'

const SAVE_FALLBACK = "Couldn't save that change. Please try again."

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** The follow-up detail behind a goal's kind: its frequency, or its target. */
function measureDetail(g: Goal): string | null {
  if (g.measureType === 'HABIT_PROCESS') {
    return g.frequencyCount && g.frequencyPeriod
      ? `${g.frequencyCount}× every ${periodLabel[g.frequencyPeriod]}`
      : null
  }
  return g.targetValue != null ? `Target: ${g.targetValue}` : 'Pass/fail'
}

/** A member's display name, falling back to their email if either name is missing. */
function memberName(user: Goal['user']): string {
  return user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.email
}

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : SAVE_FALLBACK
}

function matchesFilter(g: Goal, filter: StatusFilter): boolean {
  if (filter === 'active') return g.status === 'ACTIVE'
  if (filter === 'completed') return g.status === 'COMPLETED'
  return true
}

/** One label/value pair in a card's metadata row. */
function Meta({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string | null
}) {
  return (
    <Stack gap={0}>
      <Text
        fw={700}
        tt="uppercase"
        c="dimmed"
        style={{ fontSize: 11, letterSpacing: 0.4 }}
      >
        {label}
      </Text>
      <Text size="sm">{value}</Text>
      {detail && (
        <Text size="xs" c="dimmed">
          {detail}
        </Text>
      )}
    </Stack>
  )
}

export default function GoalsTable() {
  const [scope, setScope] = useState<'mine' | 'squad'>('mine')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const goals = useGoals(scope === 'mine')
  const navigate = useNavigate()
  const { user } = useAuth()
  const updateGoal = useUpdateGoal()

  /** The goal awaiting "Mark complete" confirmation, if any. */
  const [confirming, setConfirming] = useState<Goal | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  /**
   * Reopen has no dialog to hold an error, so a failure is shown on the card
   * it came from. Keyed by goal id because the squad view renders many cards.
   */
  const [reopenError, setReopenError] = useState<{
    id: string
    message: string
  } | null>(null)
  /** Goal id with a save in flight, used to put the right button in a loading state. */
  const [savingId, setSavingId] = useState<string | null>(null)

  const rows = useMemo(
    () => (goals.data ?? []).filter((g) => matchesFilter(g, statusFilter)),
    [goals.data, statusFilter],
  )

  /** Everything fetched for this scope, before the status filter narrows it. */
  const totalCount = goals.data?.length ?? 0

  // Auth resolves before this screen renders, but stay null-safe: with no known
  // current user we render no per-goal actions rather than guessing ownership.
  const currentUserId = user?.id ?? null

  function openConfirm(g: Goal) {
    setConfirmError(null)
    setConfirming(g)
  }

  function closeConfirm() {
    setConfirming(null)
    setConfirmError(null)
  }

  function confirmComplete() {
    if (!confirming) return
    const id = confirming.id
    setConfirmError(null)
    setSavingId(id)
    updateGoal.mutate(
      { id, status: 'COMPLETED' },
      {
        // Keep the dialog open on failure so the reason is actually seen.
        onSuccess: () => setConfirming(null),
        onError: (err) => setConfirmError(errorMessage(err)),
        onSettled: () => setSavingId(null),
      },
    )
  }

  /** Reopening is harmless, so it saves straight away with no confirmation. */
  function reopen(g: Goal) {
    setReopenError(null)
    setSavingId(g.id)
    updateGoal.mutate(
      { id: g.id, status: 'ACTIVE' },
      {
        onError: (err) =>
          setReopenError({ id: g.id, message: errorMessage(err) }),
        onSettled: () => setSavingId(null),
      },
    )
  }

  return (
    <>
      <Stack gap="sm" mb="md">
        <Group justify="space-between" align="flex-end">
          <Title order={1} fz={30}>
            Goals
          </Title>
          <Button color="arka" onClick={() => navigate({ to: '/goals/new' })}>
            Add a goal
          </Button>
        </Group>

        <Group gap="sm" wrap="wrap">
          <SegmentedControl
            value={scope}
            onChange={(v) => setScope(v as 'mine' | 'squad')}
            data={[
              { label: 'My goals', value: 'mine' },
              { label: 'Whole squad', value: 'squad' },
            ]}
            color="arka"
          />

          <SegmentedControl
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
            data={[
              { label: 'Active', value: 'active' },
              { label: 'Completed', value: 'completed' },
              { label: 'All', value: 'all' },
            ]}
            color="arka"
          />
        </Group>
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
          ) : (
            <>
              <Text fw={600}>
                {statusFilter === 'active'
                  ? 'No active goals'
                  : 'No completed goals'}
              </Text>
              <Text c="dimmed" size="sm">
                {totalCount === 1
                  ? 'There is 1 goal with a different status — switch the filter to see it.'
                  : `There are ${totalCount} goals with a different status — switch the filter to see them.`}
              </Text>
            </>
          )}
        </Stack>
      ) : (
        <Stack gap="md">
          {rows.map((g) => {
            const isOwn = currentUserId !== null && g.userId === currentUserId
            const isCompleted = g.status === 'COMPLETED'
            const isSaving = savingId === g.id
            const failed = reopenError?.id === g.id

            return (
              <Card
                key={g.id}
                withBorder
                radius="md"
                padding="md"
                // Completed goals recede so the list reads at a glance — but not
                // while they're showing an error the user needs to read.
                opacity={isCompleted && !failed ? 0.6 : undefined}
              >
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Text
                      fw={600}
                      td={isCompleted ? 'line-through' : undefined}
                      style={{ overflowWrap: 'anywhere' }}
                    >
                      {g.title}
                    </Text>

                    <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                      <Badge
                        color={statusColor[g.status] ?? 'gray'}
                        variant="light"
                      >
                        {g.status}
                      </Badge>

                      {/* No action at all on someone else's goal: the server
                          masks an ownership failure as a 404, so a disabled
                          button would only promise something that can't work. */}
                      {isOwn && g.status === 'ACTIVE' && (
                        <Button
                          size="xs"
                          variant="light"
                          color="arka"
                          loading={isSaving}
                          onClick={() => openConfirm(g)}
                        >
                          Mark complete
                        </Button>
                      )}
                      {isOwn && isCompleted && (
                        <Button
                          size="xs"
                          variant="light"
                          color="arka"
                          loading={isSaving}
                          onClick={() => reopen(g)}
                        >
                          Reopen
                        </Button>
                      )}
                    </Group>
                  </Group>

                  {g.description && (
                    <Text
                      size="sm"
                      style={{
                        // Full text, never clamped: unreadable two-line
                        // descriptions are the thing this screen fixes.
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {g.description}
                    </Text>
                  )}

                  <Group gap="xl" wrap="wrap">
                    <Meta
                      label="Kind"
                      value={
                        g.measureType === 'HABIT_PROCESS'
                          ? 'Habit / process'
                          : 'Outcome'
                      }
                      detail={measureDetail(g)}
                    />
                    <Meta label="Member" value={memberName(g.user)} />
                    <Meta label="Created" value={formatDate(g.createdAt)} />
                    {/* Completed goals only, and an em dash for the ones
                        finished before the timestamp was recorded — formatting
                        a null would just print "Invalid Date". */}
                    {isCompleted && (
                      <Meta
                        label="Completed"
                        value={g.completedAt ? formatDate(g.completedAt) : '—'}
                      />
                    )}
                  </Group>

                  {failed && reopenError && (
                    <Alert color="red" variant="light">
                      {reopenError.message}
                    </Alert>
                  )}
                </Stack>
              </Card>
            )
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
  )
}
