import { useState } from 'react'
import {
  Badge,
  Button,
  Group,
  Progress,
  SegmentedControl,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { useGoals } from './lib/goals'
import type { Goal } from './goal'
import './WeeklyCheckIn.css'

type GoalsTableProps = {
  onAddGoal: () => void
  onBack: () => void
}

const typeLabel: Record<string, string> = {
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
}

const statusColor: Record<string, string> = {
  ACTIVE: 'blue',
  COMPLETED: 'teal',
  FAILED: 'red',
  CANCELLED: 'gray',
}

function GoalProgress({ goal }: { goal: Goal }) {
  if (!goal.targetValue) {
    return (
      <Badge color={goal.status === 'COMPLETED' ? 'teal' : 'gray'} variant="light">
        {goal.status === 'COMPLETED' ? 'Done' : 'Pending'}
      </Badge>
    )
  }
  
  const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
  
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed">
        {goal.currentValue} / {goal.targetValue}
      </Text>
      <Progress value={pct} color="arka" size="sm" />
    </Stack>
  )
}

function GoalsTable({ onAddGoal, onBack }: GoalsTableProps) {
  const [scope, setScope] = useState<'mine' | 'squad'>('mine')
  const goals = useGoals(scope === 'mine')

  const rows = goals.data ?? []

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
              SMART Goals
            </Title>
            <Button color="arka" onClick={onAddGoal}>
              Add a goal
            </Button>
          </Group>

          <SegmentedControl
            value={scope}
            onChange={(v) => setScope(v as 'mine' | 'squad')}
            data={[
              { label: 'My goals', value: 'mine' },
              { label: 'Whole squad', value: 'squad' },
            ]}
            color="arka"
          />
        </Stack>
      </div>

      <div className="squad-card checkins-card" style={{ paddingTop: 0 }}>
        {goals.isLoading ? (
          <Stack align="center" py="xl">
            <Text c="dimmed">Loading…</Text>
          </Stack>
        ) : rows.length === 0 ? (
          <Stack align="center" gap={4} py="xl">
            <Text fw={600}>No goals yet</Text>
            <Text c="dimmed" size="sm">
              Lock in your SMART goals for the quarter.
            </Text>
          </Stack>
        ) : (
          <Table.ScrollContainer minWidth={700}>
            <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Member</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Goal</Table.Th>
                  <Table.Th>Progress</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((g) => (
                  <Table.Tr key={g.id}>
                    <Table.Td>
                      <Text size="sm" fw={600}>
                        {g.user.email}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color="arka" variant="light" size="sm">
                        {typeLabel[g.type] ?? g.type}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {g.title}
                      </Text>
                      <Text size="xs" c="dimmed" lineClamp={2} mt={2}>
                        <strong>S:</strong> {g.smartSpecific}
                      </Text>
                    </Table.Td>
                    <Table.Td w={160}>
                      <GoalProgress goal={g} />
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={statusColor[g.status] ?? 'gray'}
                        variant="light"
                      >
                        {g.status}
                      </Badge>
                    </Table.Td>
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

export default GoalsTable