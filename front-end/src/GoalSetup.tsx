import { useState } from 'react'
import {
  Alert,
  Button,
  Group,
  NumberInput,
  Radio,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useNavigate } from '@tanstack/react-router'
import { useCreateGoal, useIsGoalSetupLocked } from './lib/goals'
import type { MeasureType } from './goal'

type FormValues = {
  measureType: MeasureType | ''
  title: string
  description: string
  targetValue: number | ''
}

export default function GoalSetup() {
  const [submitted, setSubmitted] = useState(false)
  const createGoal = useCreateGoal()
  const navigate = useNavigate()
  const locked = useIsGoalSetupLocked()

  const form = useForm<FormValues>({
    initialValues: {
      measureType: '',
      title: '',
      description: '',
      targetValue: '',
    },
    validate: {
      measureType: (v) => (v ? null : 'Choose how this goal is measured.'),
      title: (v) => (v.trim() ? null : 'Give your goal a title.'),
      description: (v) => (v.trim() ? null : 'Description is required'),
      targetValue: (v, values) =>
        values.measureType === 'ACTION_BASED' && (!v || v < 1)
          ? 'Enter a target number (at least 1).'
          : null,
    },
  })

  function handleSubmit(values: FormValues) {
    if (!values.measureType) return
    createGoal.mutate(
      {
        type: 'QUARTERLY',
        measureType: values.measureType as MeasureType,
        title: values.title,
        description: values.description,
        targetValue:
          values.measureType === 'ACTION_BASED' && values.targetValue
            ? Number(values.targetValue)
            : undefined,
        periodChoice: 'QUARTERLY',
      },
      { onSuccess: () => setSubmitted(true) },
    )
  }

  if (locked) {
    return (
      <Stack align="center" gap="sm" py="xl">
        <Title order={2}>Goals already set for this period</Title>
        <Text c="dimmed">
          You have already saved your quarterly goal for the current period.
        </Text>
        <Button color="arka" mt="sm" onClick={() => navigate({ to: '/goals' })}>
          View Goals
        </Button>
      </Stack>
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
        New Quarterly Goal
      </Title>
      <Text c="dimmed" mb="xl">
        Goals must be specific and measurable. Stack at your own risk — it's
        all or nothing.
      </Text>

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
            placeholder="e.g. Submit 100 job applications"
            withAsterisk
            {...form.getInputProps('title')}
          />

          <Textarea
            label="Description"
            placeholder="Add details, milestones, or context..."
            autosize
            minRows={2}
            withAsterisk
            {...form.getInputProps('description')}
          />

          <Radio.Group
            label="How is this goal measured?"
            withAsterisk
            {...form.getInputProps('measureType')}
          >
            <Group mt="xs">
              <Radio
                value="ACTION_BASED"
                label="Action-based (numeric target)"
                color="arka"
              />
              <Radio
                value="PASS_FAIL"
                label="Pass/fail (yes or no)"
                color="arka"
              />
            </Group>
          </Radio.Group>

          {form.values.measureType === 'ACTION_BASED' && (
            <NumberInput
              label="Target number"
              placeholder="e.g. 100"
              min={1}
              withAsterisk
              {...form.getInputProps('targetValue')}
            />
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
