import {
  Anchor,
  Button,
  Group,
  List,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconArrowUpRight,
  IconBook,
  IconCalendarCheck,
  IconClock,
  IconClipboardCheck,
  IconExternalLink,
  IconUsers,
} from "@tabler/icons-react";
import "./GuidelinesPage.css";

const attendancePolicyUrl =
  "https://docs.google.com/document/d/1WhTFFemn8buNKcd-PWSTYWDojR6NDd_M-eji3Ik0TLA/edit?tab=t.0";

const resources = [
  {
    title: "Arka Member Portal",
    href: "https://my.arkabrotherhood.com",
    description: "Access Arka membership resources and information.",
    icon: IconUsers,
  },
  {
    title: "Missed Meeting Form",
    href: "https://forms.gle/2WMy6A3VRR5jb5X49",
    description: "Report anticipated absences in advance.",
    icon: IconCalendarCheck,
  },
  {
    title: "Official Attendance Policy",
    href: attendancePolicyUrl,
    description:
      "Review Arka's official attendance requirements and procedures.",
    icon: IconBook,
  },
  {
    title: "Attendance Tracker",
    href: "https://docs.google.com/spreadsheets/d/1-qiBksbw1Xp53c3MSe_uZUgL_XozPcQPz2bOiahlPBA/edit?gid=77398055#gid=77398055",
    description: "View attendance records and track absences.",
    icon: IconClipboardCheck,
  },
];

export default function GuidelinesPage() {
  return (
    <Stack gap="xl" maw={1100} mx="auto" pb="xl" className="guidelines-page">
      <Paper
        component="header"
        radius="lg"
        p={{ base: "lg", sm: "xl" }}
        className="guidelines-intro"
      >
        <Stack gap="md">
          <Text
            size="xs"
            fw={700}
            tt="uppercase"
            c="arka"
            style={{ letterSpacing: "0.12em" }}
          >
            Cheetah Squad · Guide
          </Text>
          <Title order={1} fz={{ base: 28, sm: 36 }} m={0}>
            Guidelines &amp; Procedures
          </Title>
          <Group gap="sm" mt="xs">
            <Button
              component="a"
              href={resources[1].href}
              target="_blank"
              rel="noopener noreferrer"
              color="arka"
              rightSection={<IconArrowUpRight size={16} aria-hidden="true" />}
            >
              Report an absence
            </Button>
            <Anchor href="#member-resources" size="sm" fw={600}>
              Browse member resources ↓
            </Anchor>
          </Group>
        </Stack>
      </Paper>

      <SimpleGrid
        cols={{ base: 1, sm: 3 }}
        spacing="md"
        aria-label="At a glance"
      >
        {[
          {
            icon: IconClipboardCheck,
            label: "Weekly goals",
            value: "Monday · 12 PM",
            detail: "Central Time. Make it a weekly habit.",
          },
          {
            icon: IconCalendarCheck,
            label: "Excused absences",
            value: "Up to 2 per quarter",
            detail: "Notify the Captain and complete the form in advance.",
          },
          {
            icon: IconClock,
            label: "Meeting day",
            value: "Arrive on time",
            detail: "Be ready to show up for the squad.",
          },
        ].map(({ icon: Icon, label, value, detail }) => (
          <Paper key={label} withBorder radius="md" p="lg">
            <Stack gap="xs">
              <Group gap="xs">
                <ThemeIcon variant="light" color="arka" radius="xl" size="md">
                  <Icon size={17} aria-hidden="true" />
                </ThemeIcon>
                <Text size="sm" c="dimmed" fw={600}>
                  {label}
                </Text>
              </Group>
              <Text size="xl" fw={700}>
                {value}
              </Text>
              <Text size="sm" c="dimmed">
                {detail}
              </Text>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>

      <Paper component="section" withBorder radius="md" p="lg">
        <Stack gap="md">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon variant="light" color="arka" size="lg" radius="md">
              <IconCalendarCheck size={22} aria-hidden="true" />
            </ThemeIcon>
            <Title order={2} size="h3" m={0}>
              Attendance Policy
            </Title>
          </Group>
          <List spacing="sm" size="sm">
            <List.Item>
              <strong>Excused Absences:</strong> Members are permitted up to two
              excused absences per calendar quarter.
            </List.Item>
            <List.Item>
              <strong>Exceeding the Quarterly Allowance:</strong> The third
              absence and each subsequent absence within a calendar quarter will
              result in a strike, regardless of whether the absence is excused.
            </List.Item>
            <List.Item>
              <strong>Unexcused Absences:</strong> Any unexcused absence will
              result in an immediate strike.
            </List.Item>
            <List.Item>
              <strong>Two Strikes:</strong> Accumulating two strikes within a
              calendar year will trigger a group discussion with the man to
              determine if the squad is still a good fit.
            </List.Item>
            <List.Item>
              <strong>Three Strikes:</strong> Accumulating three strikes within
              a calendar year constitutes grounds for dismissal from the group.
            </List.Item>
            <List.Item>
              <strong>Annual Reset:</strong> All accumulated strikes expire on
              January 1 of each year.
            </List.Item>
            <List.Item>
              <strong>Reporting Absences:</strong> Members must notify the
              Captain and complete the Missed Meeting Form in advance, as soon
              as they become aware of an anticipated absence.
            </List.Item>
          </List>
          <Text size="sm">
            For further details, refer to the{" "}
            <Anchor
              href={attendancePolicyUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Official Attendance Policy
            </Anchor>
            .
          </Text>
        </Stack>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Paper component="section" withBorder radius="md" p="lg">
          <Stack gap="md">
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon variant="light" color="arka" size="lg" radius="md">
                <IconClock size={22} aria-hidden="true" />
              </ThemeIcon>
              <Title order={2} size="h3" m={0}>
                Meeting Punctuality
              </Title>
            </Group>
            <List spacing="sm" size="sm">
              <List.Item>
                Members are expected to arrive on time for all meetings.
              </List.Item>
              <List.Item>
                Members arriving late are required to perform push-ups to
                failure upon arrival.
              </List.Item>
            </List>
          </Stack>
        </Paper>

        <Paper component="section" withBorder radius="md" p="lg">
          <Stack gap="md">
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon variant="light" color="arka" size="lg" radius="md">
                <IconClipboardCheck size={22} aria-hidden="true" />
              </ThemeIcon>
              <Title order={2} size="h3" m={0}>
                Goal Submission Deadlines
              </Title>
            </Group>
            <List spacing="sm" size="sm">
              <List.Item>
                <strong>Deadline:</strong> Weekly goals must be submitted by
                Monday at 12:00 PM Central Time.
              </List.Item>
              <List.Item>
                <strong>Late Submissions:</strong> Members who miss the deadline
                are required to perform push-ups to failure at the meeting.
              </List.Item>
              <List.Item>
                <strong>Multiple Infractions:</strong> Members who both submit
                their goals late and arrive late to the meeting must perform two
                separate sets of push-ups to failure:
                <List withPadding spacing="xs" mt="xs" size="sm">
                  <List.Item>One upon arrival.</List.Item>
                  <List.Item>One during the meeting break.</List.Item>
                </List>
              </List.Item>
            </List>
          </Stack>
        </Paper>
      </SimpleGrid>

      <section id="member-resources" className="guidelines-resources">
        <Stack gap="md">
          <div>
            <Title order={2} size="h3" mb={4}>
              Member Resources
            </Title>
            <Text size="sm" c="dimmed">
              Your squad essentials, all in one place. Links open in a new tab.
            </Text>
          </div>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {resources.map(({ icon: Icon, ...resource }) => (
              <Paper
                component="a"
                key={resource.href}
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                withBorder
                radius="md"
                p="lg"
                className="guidelines-resource"
              >
                <Group align="flex-start" wrap="nowrap" gap="md">
                  <ThemeIcon variant="light" color="arka" size="lg" radius="md">
                    <Icon size={22} aria-hidden="true" />
                  </ThemeIcon>
                  <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={600}>{resource.title}</Text>
                    <Text size="sm" c="dimmed">
                      {resource.description}
                    </Text>
                  </Stack>
                  <IconExternalLink
                    size={17}
                    aria-hidden="true"
                    style={{ flexShrink: 0 }}
                  />
                </Group>
              </Paper>
            ))}
          </SimpleGrid>
        </Stack>
      </section>
    </Stack>
  );
}
