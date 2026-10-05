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
import { useNavigate } from '@tanstack/react-router'
import { useGoals } from './lib/goals'

const statusColor: Record<string, string> = {
  ACTIVE: 'blue',
  COMPLETED: 'teal',
  FAILED: 'red',
  CANCELLED: 'gray',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function GoalsTable() {
  const [scope, setScope] = useState<'mine' | 'squad'>('mine')
  const goals = useGoals(scope === 'mine')
  const navigate = useNavigate()

  const rows = goals.data ?? []

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

      {goals.isLoading ? (
        <Stack align="center" py="xl">
          <Text c="dimmed">Loading…</Text>
        </Stack>
      ) : rows.length === 0 ? (
        <Stack align="center" gap={4} py="xl">
          <Text fw={600}>No goals yet</Text>
          <Text c="dimmed" size="sm">
            Set a goal and it'll show up here.
          </Text>
        </Stack>
      ) : (
        <Table.ScrollContainer minWidth={700}>
          <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Member</Table.Th>
                <Table.Th>Goal</Table.Th>
                <Table.Th>Measure</Table.Th>
                <Table.Th>Created</Table.Th>
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
                    <Text size="sm" fw={500}>
                      {g.title}
                    </Text>
                    {g.description && (
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {g.description}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {g.measureType === 'ACTION_BASED'
                        ? 'Action-based'
                        : 'Pass/fail'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(g.createdAt)}</Text>
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
    </>
  )
}
