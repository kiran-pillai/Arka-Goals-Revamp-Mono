import { useState } from 'react'
import {
  Badge,
  Button,
  Group,
  SegmentedControl,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { useCheckIns } from './lib/checkins'
import './WeeklyCheckIn.css'

type CheckInsTableProps = {
  onAddAnother: () => void
  onBack: () => void
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

function CheckInsTable({ onAddAnother, onBack }: CheckInsTableProps) {
  // Defaults to the current user's own check-ins; toggle to see the squad.
  const [scope, setScope] = useState<'mine' | 'squad'>('mine')
  const checkIns = useCheckIns(scope === 'mine')

  const rows = checkIns.data ?? []

  return (
    <main className="squad-screen is-table">
      <div className="checkins-sticky-header">
        <Stack gap="sm">
          <Button
            variant="subtle"
            color="arka"
            onClick={onBack}
            w="fit-content"
            px={0}
          >
            ← Back
          </Button>

          <Group justify="space-between" align="flex-end">
            <Title order={1} fz={30}>
              Squad Check-ins
            </Title>
            <Button color="arka" onClick={onAddAnother}>
              Add another check-in
            </Button>
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
      </div>

      <div className="squad-card checkins-card" style={{ paddingTop: 0 }}>
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
      </div>

      <footer className="squad-footer">
        <span>An Arka organization squad</span>
      </footer>
    </main>
  )
}

export default CheckInsTable
