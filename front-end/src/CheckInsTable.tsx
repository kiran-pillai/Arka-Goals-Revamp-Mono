import { Badge, Button, Group, Stack, Table, Text, Title } from '@mantine/core'
import type { CheckIn } from './checkin'
import './WeeklyCheckIn.css'

type CheckInsTableProps = {
  checkIns: CheckIn[]
  onAddAnother: () => void
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

function CheckInsTable({ checkIns, onAddAnother }: CheckInsTableProps) {
  return (
    <main className="squad-screen">
      <div className="squad-card checkins-card">
        <Group justify="space-between" align="center" mb="lg" wrap="nowrap">
          <Title order={1} fz={30}>
            Squad Check-ins
          </Title>
          <Button color="arka" onClick={onAddAnother}>
            Add another check-in
          </Button>
        </Group>

        {checkIns.length === 0 ? (
          <Stack align="center" gap={4} py="xl">
            <Text fw={600}>No check-ins yet</Text>
            <Text c="dimmed" size="sm">
              Submit a weekly check-in and it'll show up here.
            </Text>
          </Stack>
        ) : (
          <Table.ScrollContainer minWidth={860}>
            <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Weekly goal completed</Table.Th>
                  <Table.Th>Committing to THIS WEEK</Table.Th>
                  <Table.Th>What went well</Table.Th>
                  <Table.Th>What did NOT go well</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {checkIns.map((c, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      <Text size="sm" fw={600}>
                        {c.name}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={6}>
                        <Badge color={c.completedGoal === 'yes' ? 'teal' : 'red'}>
                          {c.completedGoal === 'yes' ? 'Yes' : 'No'}
                        </Badge>
                        {cellText(c.results)}
                      </Stack>
                    </Table.Td>
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
