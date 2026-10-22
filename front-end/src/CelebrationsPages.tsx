import {
  Alert,
  Avatar,
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "./auth/AuthContext";
import {
  centralTime,
  personName,
  useDashboard,
  useLeaderboard,
} from "./lib/celebrations";
import { getAvatarColor, getInitials } from "./lib/avatar-color";
export function DashboardPage() {
  const query = useDashboard();
  const navigate = useNavigate();
  if (query.isPending) return <Loader aria-label="Loading dashboard" />;
  if (query.isError)
    return (
      <Alert color="red" title="Could not load dashboard">
        <Button onClick={() => void query.refetch()}>Retry</Button>
      </Alert>
    );
  const d = query.data;
  return (
    <Stack gap="lg">
      <Title order={1} fz={30}>
        My Dashboard
      </Title>
      <Text c="dimmed" size="sm">
        All-time totals · Cheetah Squad
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Metric
          label="Kudos received"
          value={d.kudosReceived}
          detail="Across your check-ins"
        />
        <Metric
          label="On-time submissions"
          value={d.onTimeSubmissions}
          detail={`${d.totalSubmissions} total submissions`}
        />
        <Paper withBorder radius="md" p="lg">
          <Text size="sm" c="dimmed">
            Your squad position
          </Text>
          <Group gap="xs">
            <Text fz={36} fw={650}>
              {d.rank === null ? "—" : `#${d.rank}`}
            </Text>
            {d.tied && (
              <Badge color="arka" variant="light">
                Tied
              </Badge>
            )}
          </Group>
          <Button
            variant="subtle"
            color="arka"
            px={0}
            onClick={() => navigate({ to: "/leaderboard" })}
          >
            View leaderboard →
          </Button>
        </Paper>
      </SimpleGrid>
      {d.unknownTimingSubmissions > 0 && (
        <Text size="sm" c="dimmed">
          {d.unknownTimingSubmissions} historical{" "}
          {d.unknownTimingSubmissions === 1 ? "check-in has" : "check-ins have"}{" "}
          no recorded deadline. They count toward total submissions; on-time
          credit is unavailable.
        </Text>
      )}
      <SimpleGrid cols={{ base: 1, md: d.kudosReceived > 0 ? 2 : 1 }}>
        <Paper withBorder radius="md" p="lg">
          <Title order={2} fz={18} mb="md">
            Recent check-ins
          </Title>
          <Stack gap="sm">
            {d.recentCheckIns.length === 0 ? (
              <>
                <Text fw={600}>Your first check-in starts the story</Text>
                <Text size="sm" c="dimmed">
                  Submit a check-in to start building your history.
                </Text>
                <Button color="arka" onClick={() => navigate({ to: "/form" })}>
                  Add check-in
                </Button>
              </>
            ) : (
              d.recentCheckIns.map((c) => (
                <Group key={c.id} justify="space-between">
                  <Button
                    variant="subtle"
                    color="arka"
                    onClick={() =>
                      navigate({ to: "/", search: { checkInId: c.id } })
                    }
                  >
                    {centralTime(c.createdAt)}
                  </Button>
                  <Badge
                    color={
                      c.timingStatus === "ON_TIME"
                        ? "teal"
                        : c.timingStatus === "LATE"
                          ? "orange"
                          : "gray"
                    }
                    variant="light"
                  >
                    {c.timingStatus === "ON_TIME"
                      ? "On time"
                      : c.timingStatus === "LATE"
                        ? "Late"
                        : "Timing unavailable"}
                  </Badge>
                </Group>
              ))
            )}
          </Stack>
        </Paper>
        {d.kudosReceived > 0 && (
          <Paper withBorder radius="md" p="lg">
            <Title order={2} fz={18} mb="md">
              Recent recognition
            </Title>
            <Stack gap="md">
              {d.recentRecognition.map((r) => (
                <Group key={r.id} wrap="nowrap" align="flex-start">
                  <Avatar color={getAvatarColor(r.giver.colorSlot)}>
                    {getInitials(
                      r.giver.firstName,
                      r.giver.lastName,
                      r.giver.email,
                    )}
                  </Avatar>
                  <div>
                    <Text size="sm" fw={600}>
                      {personName(r.giver)}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Gave kudos {centralTime(r.createdAt)}
                    </Text>
                    <Button
                      size="xs"
                      color="arka"
                      variant="subtle"
                      px={0}
                      onClick={() =>
                        navigate({
                          to: "/",
                          search: { checkInId: r.checkInId },
                        })
                      }
                    >
                      View {centralTime(r.checkIn.createdAt)} check-in
                    </Button>
                  </div>
                </Group>
              ))}
            </Stack>
          </Paper>
        )}
      </SimpleGrid>
    </Stack>
  );
}
function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <Paper withBorder radius="md" p="lg">
      <Text c="dimmed" size="sm">
        {label}
      </Text>
      <Text fz={36} fw={650}>
        {value}
      </Text>
      <Text size="sm" c="dimmed">
        {detail}
      </Text>
    </Paper>
  );
}
export function LeaderboardPage() {
  const query = useLeaderboard();
  const { user } = useAuth();
  if (query.isPending) return <Loader aria-label="Loading leaderboard" />;
  if (query.isError)
    return (
      <Alert color="red" title="Could not load leaderboard">
        <Button onClick={() => void query.refetch()}>Retry</Button>
      </Alert>
    );
  return (
    <Stack gap="lg">
      <Title order={1} fz={30}>
        Leaderboard
      </Title>
      <Text size="sm" c="dimmed">
        Cheetah Squad · All time
      </Text>
      <Text size="sm">
        Most on-time submissions first. Higher total submissions breaks ties.
        Matching counts share a rank, with no gaps.
      </Text>
      <Paper withBorder radius="md" p="md">
        {query.data.length === 0 ? (
          <Stack align="center" py="xl">
            <Text fw={600}>A fresh start for the squad</Text>
            <Text c="dimmed" size="sm">
              Submit a check-in to join the leaderboard.
            </Text>
          </Stack>
        ) : (
          <Table.ScrollContainer minWidth={530}>
            <Table verticalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Rank</Table.Th>
                  <Table.Th>Member</Table.Th>
                  <Table.Th>On-time submissions</Table.Th>
                  <Table.Th>Total submissions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {query.data.map((m) => (
                  <Table.Tr
                    key={m.id}
                    bg={
                      m.id === user?.id
                        ? "var(--mantine-color-arka-light)"
                        : undefined
                    }
                  >
                    <Table.Td>
                      <Group gap="xs">
                        {m.rank}
                        {m.tied && (
                          <Badge color="arka" variant="light" size="xs">
                            Tied
                          </Badge>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Text size="sm">{personName(m)}</Text>
                        {m.id === user?.id && (
                          <Badge color="arka" variant="light" size="xs">
                            You
                          </Badge>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td fw={700}>{m.onTimeSubmissions}</Table.Td>
                    <Table.Td>{m.totalSubmissions}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>
      <Text size="xs" c="dimmed">
        Historical check-ins without a recorded deadline count toward total
        submissions. On-time credit is available for check-ins with recorded
        deadlines.
      </Text>
    </Stack>
  );
}
