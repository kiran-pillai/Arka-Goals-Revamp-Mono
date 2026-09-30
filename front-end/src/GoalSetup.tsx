import { useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Group,
  NumberInput,
  Radio,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useNavigate } from '@tanstack/react-router'
import { useCreateGoal } from './lib/goals'
import type { GoalType, MeasureType, GoalPeriodChoice } from './goal'

type Step = 'choose-period' | 'enter-goal'

type FormValues = {
  type: GoalType | ''
  measureType: MeasureType | ''
  title: string
  description: string
  targetValue: number | ''
}

export default function GoalSetup() {
  const [step, setStep] = useState<Step>('choose-period')
  const [periodChoice, setPeriodChoice] = useState<GoalPeriodChoice | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const createGoal = useCreateGoal()
  const navigate = useNavigate()

  const form = useForm<FormValues>({
    initialValues: {
      type: '',
      measureType: '',
      title: '',
      description: '',
      targetValue: '',
    },
    validate: {
      type: (v) => (v ? null : 'Choose a goal type.'),
      measureType: (v) => (v ? null : 'Choose how this goal is measured.'),
      title: (v) => (v.trim() ? null : 'Give your goal a title.'),
      targetValue: (v, values) =>
        values.measureType === 'ACTION_BASED' && (!v || v < 1)
          ? 'Enter a target number (at least 1).'
          : null,
    },
  })

  function handlePeriodNext(choice: GoalPeriodChoice) {
    setPeriodChoice(choice)
    form.setFieldValue('type', choice)
    setStep('enter-goal')
  }

  function handleSubmit(values: FormValues) {
    if (!values.type || !values.measureType) return
    createGoal.mutate(
      {
        type: values.type as GoalType,
        measureType: values.measureType as MeasureType,
        title: values.title,
        description: values.description || undefined,
        targetValue:
          values.measureType === 'ACTION_BASED' && values.targetValue
            ? Number(values.targetValue)
            : undefined,
        periodChoice: periodChoice ?? undefined,
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
          Your {periodChoice?.toLowerCase() ?? ''} goal is locked in. Stay accountable.
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
              setStep('choose-period')
              setPeriodChoice(null)
            }}
          >
            Add another goal
          </Button>
        </Group>
      </Stack>
    )
  }

  if (step === 'choose-period') {
    return (
      <div style={{ textAlign: 'center' }}>
        <Title order={1} mt="xl" mb={4} fz={34}>
          Set Your Goals
        </Title>
        <Text c="dimmed" mb="md">
          First things first — choose your goal cadence for this quarter.
        </Text>

        <Text fw={600} size="lg">
          Monthly or Quarterly?
        </Text>
        <Text size="sm" c="dimmed" mt={4}>
          You can choose one or the other, not both. Monthly goals are set fresh
          each month (20 pts each). A quarterly goal spans the full quarter (60 pts).
        </Text>

        <Group justify="center" gap="md" mt="xl">
          <Button
            color="arka"
            size="lg"
            radius="md"
            w={180}
            onClick={() => handlePeriodNext('MONTHLY')}
          >
            Monthly
          </Button>
          <Button
            variant="light"
            color="arka"
            size="lg"
            radius="md"
            w={180}
            onClick={() => handlePeriodNext('QUARTERLY')}
          >
            Quarterly
          </Button>
        </Group>
      </div>
    )
  }

  return (
    <>
      <Title order={1} mb={4} fz={34}>
        New {periodChoice === 'QUARTERLY' ? 'Quarterly' : 'Monthly'} Goal
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

          <div>
            <Badge color="arka" variant="light" size="lg" mb="xs">
              {periodChoice}
            </Badge>
          </div>

          <SegmentedControl
            fullWidth
            value={form.values.type || undefined}
            onChange={(v) => form.setFieldValue('type', v as GoalType)}
            data={
              periodChoice === 'MONTHLY'
                ? [
                    { label: 'Monthly Goal', value: 'MONTHLY' },
                    { label: 'Weekly Goal', value: 'WEEKLY' },
                    { label: 'Give-Up', value: 'GIVE_UP' },
                  ]
                : [
                    { label: 'Quarterly Goal', value: 'QUARTERLY' },
                    { label: 'Weekly Goal', value: 'WEEKLY' },
                    { label: 'Give-Up', value: 'GIVE_UP' },
                  ]
            }
            color="arka"
          />

          <TextInput
            label="Goal title"
            placeholder="e.g. Submit 100 job applications"
            withAsterisk
            {...form.getInputProps('title')}
          />

          <Textarea
            label="Description (optional)"
            placeholder="Add details, milestones, or context..."
            autosize
            minRows={2}
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

          <Group justify="space-between" mt="sm">
            <Button
              variant="subtle"
              color="arka"
              onClick={() => {
                setStep('choose-period')
                form.reset()
              }}
            >
              Back
            </Button>
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
