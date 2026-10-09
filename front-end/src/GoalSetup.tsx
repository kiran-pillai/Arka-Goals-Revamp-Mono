import { useState } from 'react'
import {
  Alert,
  Button,
  Group,
  NumberInput,
  Paper,
  Radio,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useNavigate } from '@tanstack/react-router'
import { useCreateGoal } from './lib/goals'
import type { FrequencyPeriod, MeasureType } from './goal'

/** The SMART breakdown, rendered as cards inside the goal-framework panel. */
const smartLetters: { letter: string; word: string; gloss: string }[] = [
  {
    letter: 'S',
    word: 'Specific',
    gloss: "Name the actual thing you'll do. “Get better” isn't a goal.",
  },
  {
    letter: 'M',
    word: 'Measurable',
    gloss: "Put a number on it, so there's no arguing at quarter-end.",
  },
  {
    letter: 'A',
    word: 'Achievable',
    gloss: "Hard enough to matter, close enough that you'd bet on yourself.",
  },
  {
    letter: 'R',
    word: 'Relevant',
    gloss: "Tied to what you're actually here to move this quarter.",
  },
  {
    letter: 'T',
    word: 'Time-bound',
    gloss: 'Has a date. Without one it drifts forever.',
  },
]

const frequencyPeriods: { value: FrequencyPeriod; label: string }[] = [
  { value: 'DAY', label: 'Day' },
  { value: 'WEEK', label: 'Week' },
  { value: 'MONTH', label: 'Month' },
  { value: 'QUARTER', label: 'Quarter' },
]

type FormValues = {
  measureType: MeasureType | ''
  title: string
  description: string
  frequencyCount: number | ''
  frequencyPeriod: FrequencyPeriod | ''
}

export default function GoalSetup() {
  const [submitted, setSubmitted] = useState(false)
  const createGoal = useCreateGoal()
  const navigate = useNavigate()
  const form = useForm<FormValues>({
    initialValues: {
      measureType: '',
      title: '',
      description: '',
      frequencyCount: '',
      frequencyPeriod: '',
    },
    validate: {
      measureType: (v) => (v ? null : 'Choose what kind of goal this is.'),
      title: (v) => (v.trim() ? null : 'Give your goal a title.'),
      description: (v) => (v.trim() ? null : 'Description is required'),
      frequencyCount: (v, values) =>
        values.measureType === 'HABIT_PROCESS' && (!v || v < 1)
          ? 'Enter how many times (at least 1).'
          : null,
      frequencyPeriod: (v, values) =>
        values.measureType === 'HABIT_PROCESS' && !v
          ? 'Choose how often this repeats.'
          : null,
    },
  })

  function handleSubmit(values: FormValues) {
    if (!values.measureType) return
    const isHabit = values.measureType === 'HABIT_PROCESS'
    createGoal.mutate(
      {
        type: 'QUARTERLY',
        measureType: values.measureType,
        title: values.title,
        description: values.description,
        frequencyCount:
          isHabit && values.frequencyCount
            ? Number(values.frequencyCount)
            : undefined,
        frequencyPeriod: isHabit ? values.frequencyPeriod || undefined : undefined,
        periodChoice: 'QUARTERLY',
      },
      { onSuccess: () => setSubmitted(true) },
    )
  }

  if (submitted) {
    return (
      <Stack align="center" gap="sm" py="xl">
        <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 52, height: 52, color: '#a85f22', padding: 12, borderRadius: '50%', background: 'rgba(230, 165, 50, 0.15)', boxSizing: 'border-box' }}>
          <path
            d="M20 6 9 17l-5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <Title order={2}>Goal saved</Title>
        <Text c="dimmed">
          Your quarterly goal is locked in. Stay accountable.
        </Text>
        <Group mt="sm" gap="sm">
          <Button color="arka" onClick={() => navigate({ to: '/goals' })}>
            View goals
          </Button>
          <Button
            variant="light"
            color="arka"
            onClick={() => {
              setSubmitted(false)
              form.reset()
            }}
          >
            Add another goal
          </Button>
        </Group>
      </Stack>
    )
  }

  return (
    <>
      <Title order={1} mb={4} fz={34}>
        New Goal
      </Title>
      <Text c="dimmed" mb="xl">
        Goals must be specific and measurable.
      </Text>

      <Stack gap="sm" mb="xl">
        <Text fw={500}>Framework for setting goals: </Text>
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, lg: 5 }} spacing="xs">
          {smartLetters.map(({ letter, word, gloss }) => (
            <Paper key={letter} withBorder radius="md" p="sm">
              <Text fz={30} fw={700} lh={1.1} c="var(--mantine-color-arka-text)">
                {letter}
              </Text>
              <Text size="sm" fw={600}>
                {word}
              </Text>
              <Text size="xs" c="dimmed" style={{ overflowWrap: 'anywhere' }}>
                {gloss}
              </Text>
            </Paper>
          ))}
        </SimpleGrid>
        <Stack gap="xs" pl="lg">
          <Text size="sm">
            <Text span fw={600} inherit>
              Weak:
            </Text>{' '}
            “Find a new job this quarter.” — not yours to decide, no number, no
            date.
          </Text>
          <Text size="sm">
            <Text span fw={600} inherit>
              SMART:
            </Text>{' '}
            “Submit 100 job applications by December 31.” — about 8 a week, and
            nobody else decides whether you hit submit.
          </Text>
        </Stack>
      </Stack>

      <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
        <Stack gap="lg">
          {createGoal.isError && (
            <Alert color="red" variant="light">
              {(createGoal.error as Error)?.message ??
                "Couldn't save your goal. Please try again."}
            </Alert>
          )}

          <TextInput
            label="Goal title"
            description="Say what you'll do and how much. Pick something nobody else has to approve."
            placeholder="e.g. Submit 100 job applications"
            withAsterisk
            {...form.getInputProps('title')}
          />

          <Textarea
            label="Description"
            description="Add the detail your squad would need to tell whether you hit it."
            placeholder="Add details, milestones, or context..."
            autosize
            minRows={2}
            withAsterisk
            {...form.getInputProps('description')}
          />

          <Radio.Group
            label="What kind of goal is this?"
            description="A habit repeats on a schedule. An outcome lands once, by a date."
            withAsterisk
            {...form.getInputProps('measureType')}
          >
            <Stack gap="xs" mt="xs">
              <Radio
                value="HABIT_PROCESS"
                label="Habit / process — a behavior you repeat on a schedule"
                color="arka"
              />
              <Radio
                value="OUTCOME"
                label="Outcome — a result you either hit or miss"
                color="arka"
              />
            </Stack>
          </Radio.Group>

          {form.values.measureType === 'HABIT_PROCESS' && (
            <Group grow align="flex-start">
              <NumberInput
                label="How many times?"
                placeholder="e.g. 3"
                min={1}
                withAsterisk
                {...form.getInputProps('frequencyCount')}
              />
              <Select
                label="Every"
                placeholder="Pick a period"
                data={frequencyPeriods}
                withAsterisk
                {...form.getInputProps('frequencyPeriod')}
              />
            </Group>
          )}

          <Group justify="flex-end" mt="sm">
            <Button
              type="submit"
              color="arka"
              loading={createGoal.isPending}
            >
              Save goal
            </Button>
          </Group>
        </Stack>
      </form>
    </>
  )
}
