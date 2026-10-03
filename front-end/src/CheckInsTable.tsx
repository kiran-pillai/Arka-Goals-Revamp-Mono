import { useMemo, useState } from 'react'
import {
  Badge,
  Group,
  SegmentedControl,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { useCheckIns } from './lib/checkins'

/** Return the Monday (start of ISO week) for a given date. */
function getWeekMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Format a date as "Mon DD, YYYY" in en-US locale. */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Return "Week of Mon DD, YYYY – Mon DD, YYYY" (monday to sunday). */
function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return `Week of ${formatDate(monday)} – ${formatDate(sunday)}`
}

function cellText(value: string) {
  return value.trim() ? (
    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
      {value}
    </Text>
  ) : (
    <Text size="sm" c="dimmed">
      —
    </Text>
  )
}

export default function CheckInsTable() {
  const [scope, setScope] = useState<'mine' | 'squad'>('mine')
  const checkIns = useCheckIns(scope === 'mine')

  const COL_COUNT = 7

  const sortedRows = useMemo(
    () =>
      [...(checkIns.data ?? [])].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [checkIns.data],
  )

  type SeparatorItem = { kind: 'separator'; label: string }
  type DataItem = { kind: 'data'; checkIn: (typeof sortedRows)[number] }
  type RowItem = SeparatorItem | DataItem

  const rowItems: RowItem[] = useMemo(() => {
    const items: RowItem[] = []
    let lastMondayTime: number | null = null

    for (const c of sortedRows) {
      const monday = getWeekMonday(new Date(c.createdAt))
      const mondayTime = monday.getTime()

      if (lastMondayTime === null || mondayTime !== lastMondayTime) {
        items.push({ kind: 'separator', label: formatWeekLabel(monday) })
        lastMondayTime = mondayTime
      }

      items.push({ kind: 'data', checkIn: c })
    }

    return items
  }, [sortedRows])

  return (
    <>
      <Stack gap="sm" mb="md">
        <Group justify="space-between" align="flex-end">
          <Title order={1} fz={30}>
            Squad Check-ins
          </Title>
        </Group>

        <SegmentedControl
          value={scope}
          onChange={(v) => setScope(v as 'mine' | 'squad')}
          data={[
            { label: 'My check-ins', value: 'mine' },
            { label: 'Whole squad', value: 'squad' },
          ]}
          color="arka"
        />
      </Stack>

      {checkIns.isLoading ? (
        <Stack align="center" py="xl">
          <Text c="dimmed">Loading…</Text>
        </Stack>
      ) : sortedRows.length === 0 ? (
        <Stack align="center" gap={4} py="xl">
          <Text fw={600}>No check-ins yet</Text>
          <Text c="dimmed" size="sm">
            Submit a weekly check-in and it'll show up here.
          </Text>
        </Stack>
      ) : (
        <Table.ScrollContainer minWidth={1000}>
          <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Member</Table.Th>
                <Table.Th ta="center">Weekly Goal Completed?</Table.Th>
                <Table.Th>Results Related to Goal</Table.Th>
                <Table.Th>Committing to This Week</Table.Th>
                <Table.Th>What Went Well</Table.Th>
                <Table.Th>What Did Not Go Well</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(() => {
                let dataRowIndex = 0
                return rowItems.map((item, idx) => {
                  if (item.kind === 'separator') {
                    return (
                      <Table.Tr key={`sep-${idx}`}>
                        <Table.Td
                          colSpan={COL_COUNT}
                          style={{
                            borderTop:
                              '2px solid var(--mantine-color-arka-filled)',
                          }}
                        >
                          <Text fw={700} c="arka" size="sm">
                            {item.label}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    )
                  }

                  const c = item.checkIn
                  const isOdd = dataRowIndex % 2 === 1
                  dataRowIndex++

                  return (
                    <Table.Tr
                      key={c.id}
                      style={
                        isOdd
                          ? {
                              backgroundColor:
                                'var(--mantine-color-default-hover)',
                            }
                          : undefined
                      }
                    >
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {formatDate(new Date(c.createdAt))}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={600}>
                          {c.user.firstName && c.user.lastName
                            ? `${c.user.firstName} ${c.user.lastName}`
                            : c.user.email}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="center">
                        <Badge color={c.completedGoal ? 'teal' : 'red'}>
                          {c.completedGoal ? 'Yes' : 'No'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{cellText(c.results)}</Table.Td>
                      <Table.Td>{cellText(c.commitments)}</Table.Td>
                      <Table.Td>{cellText(c.wins)}</Table.Td>
                      <Table.Td>{cellText(c.frictions)}</Table.Td>
                    </Table.Tr>
                  )
                })
              })()}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </>
  )
}
