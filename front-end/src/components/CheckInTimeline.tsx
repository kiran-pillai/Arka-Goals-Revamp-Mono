import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Badge, Box, Group, Stack, Text, UnstyledButton } from '@mantine/core'
import { IconActivity, IconClock, IconMessageCircle, IconThumbUp, IconThumbDown } from '@tabler/icons-react'
import type { CheckIn } from '../checkin'
import { getAvatarColor, getInitials } from '../lib/avatar-color'
import CommentThread from './CommentThread'

function getWeekMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return `Week of ${formatDate(monday)} – ${formatDate(sunday)}`
}

type WeekGroup = { label: string; items: CheckIn[] }

type Props = {
  checkIns: CheckIn[]
  onAddComment: (checkInId: string, text: string) => void
  onDeleteComment: (checkInId: string, commentId: string) => void
}

export default function CheckInTimeline({ checkIns, onAddComment, onDeleteComment }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const weeks = useMemo(() => {
    const sorted = [...checkIns].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    const groups: WeekGroup[] = []
    let lastMondayTime: number | null = null

    for (const c of sorted) {
      const monday = getWeekMonday(new Date(c.createdAt))
      const mondayTime = monday.getTime()

      if (lastMondayTime === null || mondayTime !== lastMondayTime) {
        groups.push({ label: formatWeekLabel(monday), items: [] })
        lastMondayTime = mondayTime
      }
      groups[groups.length - 1].items.push(c)
    }
    return groups
  }, [checkIns])

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Stack gap="xl">
      {weeks.map((week) => (
        <Box key={week.label}>
          <Text fw={700} c="arka" size="sm" mb="md">
            {week.label}
          </Text>

          <Stack gap="md" style={{ position: 'relative', paddingLeft: 40 }}>
            <Box
              style={{
                position: 'absolute',
                left: 18,
                top: 0,
                bottom: 0,
                width: 2,
                background: 'var(--mantine-color-default-border)',
              }}
            />

            {week.items.map((c) => {
              const isExpanded = expanded.has(c.id)
              const color = getAvatarColor(c.user.colorSlot)
              const initials = getInitials(c.user.firstName, c.user.lastName, c.user.email)
              const name =
                c.user.firstName && c.user.lastName
                  ? `${c.user.firstName} ${c.user.lastName}`
                  : c.user.email
              const commentCount = c.comments?.length ?? 0

              return (
                <Box key={c.id} style={{ position: 'relative' }}>
                  <Box
                    style={{
                      position: 'absolute',
                      left: -40,
                      top: 18,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: color,
                      border: '3px solid var(--mantine-color-body)',
                      boxShadow: `0 0 0 2px ${color}`,
                    }}
                  />

                  <Box
                    style={{
                      border: '1px solid var(--mantine-color-default-border)',
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}
                  >
                    <UnstyledButton
                      data-testid="timeline-header"
                      onClick={() => toggle(c.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '14px 16px',
                        width: '100%',
                      }}
                    >
                      <Box
                        data-testid="avatar"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 12,
                          color: '#fff',
                          flexShrink: 0,
                          backgroundColor: color,
                        }}
                      >
                        {initials}
                      </Box>

                      <Box style={{ flex: 1 }}>
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
                              leftSection={<IconMessageCircle size={16} />}
                            >
                              {commentCount}
                            </Badge>
                          )}
                        </Group>
                        <Text size="xs" c="dimmed">
                          {formatDate(new Date(c.createdAt))}
                        </Text>
                      </Box>

                      <Badge
                        color={c.completedGoal ? 'teal' : 'red'}
                        variant="light"
                      >
                        {c.completedGoal ? 'Goal met' : 'Not met'}
                      </Badge>
                    </UnstyledButton>

                    {isExpanded && (
                      <Box p="md" pt={0}>
                        <Stack gap="sm">
                          <FieldRow icon={<IconActivity size={16} />} label="Results Related to Goal" value={c.results} />
                          <FieldRow icon={<IconClock size={16} />} label="Committing to This Week" value={c.commitments} />
                          <FieldRow icon={<IconThumbUp size={16} />} label="What Went Well" value={c.wins} />
                          <FieldRow icon={<IconThumbDown size={16} />} label="What Did Not Go Well" value={c.frictions} />
                        </Stack>

                        <Box mt="md">
                          <CommentThread
                            comments={c.comments ?? []}
                            onAddComment={(text) => onAddComment(c.id, text)}
                            onDeleteComment={(commentId) => onDeleteComment(c.id, commentId)}
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              )
            })}
          </Stack>
        </Box>
      ))}
    </Stack>
  )
}

function FieldRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Group gap={8} align="flex-start" wrap="nowrap">
      <Box c="dimmed" style={{ flexShrink: 0, marginTop: 1 }}>
        {icon}
      </Box>
      <Box style={{ flex: 1 }}>
        <Text fw={700} tt="uppercase" c="dimmed" style={{ fontSize: 11, letterSpacing: 0.4 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 13, marginTop: 2, whiteSpace: 'pre-wrap', color: 'var(--mantine-color-text)' }}>
          {value}
        </Text>
      </Box>
    </Group>
  )
}
