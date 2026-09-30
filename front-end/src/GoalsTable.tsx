import { useState } from 'react'
import { Table, Modal, Stack, Text, Badge, Group, Button, Paper } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useGoals } from './lib/goals'
import { useAuth } from './auth/AuthContext'
import type { Goal } from './goal'

type GoalsTableProps = {
  scope: 'mine' | 'squad'
}

export default function GoalsTable({ scope }: GoalsTableProps) {
  const { data: goals, isLoading, error } = useGoals(scope === 'mine')
  const { user } = useAuth()
  const [opened, { open, close }] = useDisclosure(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)

  if (isLoading) return <Text c="dimmed">Loading goals...</Text>
  if (error) return <Text c="red">Failed to load goals.</Text>

  if (!goals || goals.length === 0) {
    return (
      <Paper p="xl" withBorder ta="center" mt="md">
        <Text c="dimmed">No goals yet</Text>
        <Text fw={500}>Lock in your SMART goals for the quarter.</Text>
      </Paper>
    )
  }

  function handleRowClick(goal: Goal) {
    setSelectedGoal(goal)
    open()
  }

  const rows = goals.map((goal) => (
    <Table.Tr 
      key={goal.id} 
      onClick={() => handleRowClick(goal)}
      style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
      className="hover-row"
    >
      <Table.Td>{goal.title}</Table.Td>
      <Table.Td>{goal.type}</Table.Td>
      <Table.Td>{goal.status}</Table.Td>
      {scope === 'squad' && <Table.Td>{goal.user.email}</Table.Td>}
    </Table.Tr>
  ))

  return (
    <>
      <Table striped highlightOnHover mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Goal</Table.Th>
            <Table.Th>Cadence</Table.Th>
            <Table.Th>Status</Table.Th>
            {scope === 'squad' && <Table.Th>Owner</Table.Th>}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      <Modal 
        opened={opened} 
        onClose={close} 
        title={<Text fw={700} size="xl">{selectedGoal?.title}</Text>} 
        size="lg" 
        centered
      >
        {selectedGoal && (
          <Stack gap="sm">
            <Group mb="sm">
              <Badge color="arka">{selectedGoal.type}</Badge>
              <Badge color={selectedGoal.status === 'ACTIVE' ? 'green' : 'gray'}>
                {selectedGoal.status}
              </Badge>
              {scope === 'squad' && (
                <Text size="sm" c="dimmed">Owner: {selectedGoal.user.email}</Text>
              )}
            </Group>

            <Paper withBorder p="sm" bg="gray.0">
              <Text fw={700} c="dark.4" size="sm" tt="uppercase">Specific</Text>
              <Text mt={4}>{selectedGoal.smartSpecific}</Text>
            </Paper>

            <Paper withBorder p="sm" bg="gray.0">
              <Text fw={700} c="dark.4" size="sm" tt="uppercase">Measurable</Text>
              <Text mt={4}>{selectedGoal.smartMeasurable}</Text>
            </Paper>

            <Paper withBorder p="sm" bg="gray.0">
              <Text fw={700} c="dark.4" size="sm" tt="uppercase">Achievable</Text>
              <Text mt={4}>{selectedGoal.smartAchievable}</Text>
            </Paper>

            <Paper withBorder p="sm" bg="gray.0">
              <Text fw={700} c="dark.4" size="sm" tt="uppercase">Relevant</Text>
              <Text mt={4}>{selectedGoal.smartRelevant}</Text>
            </Paper>

            <Paper withBorder p="sm" bg="gray.0">
              <Text fw={700} c="dark.4" size="sm" tt="uppercase">Time-bound</Text>
              <Text mt={4}>{selectedGoal.smartTimeBound}</Text>
            </Paper>

            {selectedGoal.targetValue && (
              <Paper withBorder p="sm" bg="gray.0">
                <Text fw={700} c="dark.4" size="sm" tt="uppercase">Target Value</Text>
                <Text mt={4}>{selectedGoal.currentValue} / {selectedGoal.targetValue}</Text>
              </Paper>
            )}

            {user?.id === selectedGoal.userId && (
              <Group justify="flex-end" mt="md">
                <Button variant="light" color="arka" onClick={() => alert('Edit modal integration pending.')}>
                  Edit Goal
                </Button>
              </Group>
            )}
          </Stack>
        )}
      </Modal>
    </>
  )
}