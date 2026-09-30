import { useState } from 'react'
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

  const rows = checkIns.data ?? []

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
      ) : rows.length === 0 ? (
        <Stack align="center" gap={4} py="xl">
          <Text fw={600}>No check-ins yet</Text>
          <Text c="dimmed" size="sm">
            Submit a weekly check-in and it'll show up here.
          </Text>
        </Stack>
      ) : (
        <Table.ScrollContainer minWidth={1000}>
          <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Member</Table.Th>
                <Table.Th ta="center">Weekly Goal Completed?</Table.Th>
                <Table.Th>Results Related to Goal</Table.Th>
                <Table.Th>Committing to This Week</Table.Th>
                <Table.Th>What Went Well</Table.Th>
                <Table.Th>What Did Not Go Well</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((c) => (
                <Table.Tr key={c.id}>
                  <Table.Td>
                    <Text size="sm" fw={600}>
                      {c.user.email}
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
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </>
  )
}
