import { useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Group,
  NumberInput,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useCreateGoal } from './lib/goals'
import type { GoalType } from './goal'
import './WeeklyCheckIn.css'

type GoalSetupProps = {
  onBack: () => void
  onViewGoals: () => void
}

type Step = 'choose-period' | 'enter-goal'

type FormValues = {
  type: GoalType | ''
  title: string
  smartSpecific: string
  smartMeasurable: string
  smartAchievable: string
  smartRelevant: string
  smartTimeBound: string
  targetValue: number | ''
}

function GoalSetup({ onBack, onViewGoals }: GoalSetupProps) {
  const [step, setStep] = useState<Step>('choose-period')
  const [submitted, setSubmitted] = useState(false)
  const createGoal = useCreateGoal()

  const form = useForm<FormValues>({
    initialValues: {
      type: '',
      title: '',
      smartSpecific: '',
      smartMeasurable: '',
      smartAchievable: '',
      smartRelevant: '',
      smartTimeBound: '',
      targetValue: '',
    },
    validate: {
      type: (v) => (v ? null : 'Choose a goal type.'),
      title: (v) => (v.trim() ? null : 'Give your goal a title.'),
      smartSpecific: (v) => (v.trim() ? null : 'Required.'),
      smartMeasurable: (v) => (v.trim() ? null : 'Required.'),
      smartAchievable: (v) => (v.trim() ? null : 'Required.'),
      smartRelevant: (v) => (v.trim() ? null : 'Required.'),
      smartTimeBound: (v) => (v.trim() ? null : 'Required.'),
    },
  })

  function handlePeriodNext(choice: GoalType) {
    form.setFieldValue('type', choice)
    setStep('enter-goal')
  }

  function handleSubmit(values: FormValues) {
    if (!values.type) return
    createGoal.mutate(
      {
        type: values.type,
        title: values.title,
        smartSpecific: values.smartSpecific,
        smartMeasurable: values.smartMeasurable,
        smartAchievable: values.smartAchievable,
        smartRelevant: values.smartRelevant,
        smartTimeBound: values.smartTimeBound,
        targetValue: values.targetValue ? Number(values.targetValue) : undefined,
      },
      { onSuccess: () => setSubmitted(true) },
    )
  }

  return (
    <main className="squad-screen">
      <div className={`squad-card${step === 'choose-period' && !submitted ? ' is-landing' : ''}`}>
        <header className="brand">
          <img className="brand-arka" src="/images/Arka_Icon.webp" alt="Arka" />
          <span className="brand-org">ARKA</span>
        </header>

        {submitted ? (
          <div className="checkin-sent" role="status">
            <svg viewBox="0 0 24 24" aria-hidden="true">
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
              Your {form.values.type.toLowerCase()} goal is locked in. Stay accountable.
            </Text>
            <Group mt="sm" gap="sm" justify="center">
              <Button color="arka" onClick={onViewGoals}>
                View goals
              </Button>
              <Button
                variant="light"
                color="arka"
                onClick={() => {
                  setSubmitted(false)
                  form.reset()
                  setStep('choose-period')
                }}
              >
                Add another goal
              </Button>
            </Group>
          </div>
        ) : step === 'choose-period' ? (
          <>
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

            <Group justify="flex-start" mt="lg">
              <Button variant="subtle" color="arka" size="sm" onClick={onBack}>
                Back
              </Button>
            </Group>
          </>
        ) : (
          <>
            <Title order={1} mt="xl" mb={4} fz={34}>
              New {form.values.type === 'QUARTERLY' ? 'Quarterly' : 'Monthly'} Goal
            </Title>
            <Text c="dimmed" mb="xl">
              Break it down. SMART goals are Specific, Measurable, Achievable, Relevant, and Time-bound.
            </Text>

            <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
              <Stack gap="lg">
                {createGoal.isError && (
                  <Alert color="red" variant="light">
                    {(createGoal.error as Error)?.message ??
                      "Couldn’t save your goal. Please try again."}
                  </Alert>
                )}

                <div>
                  <Badge color="arka" variant="light" size="lg" mb="xs">
                    {form.values.type}
                  </Badge>
                </div>

                <TextInput
                  label="Goal Title"
                  placeholder="e.g. Land a new engineering role"
                  withAsterisk
                  {...form.getInputProps('title')}
                />

                <Textarea
                  label="Specific"
                  description="What exactly will you accomplish?"
                  placeholder="I will apply to 50 senior manufacturing roles in Austin..."
                  autosize
                  minRows={2}
                  withAsterisk
                  {...form.getInputProps('smartSpecific')}
                />

                <Textarea
                  label="Measurable"
                  description="How will you track progress?"
                  placeholder="I will log 5 submitted applications per week..."
                  autosize
                  minRows={2}
                  withAsterisk
                  {...form.getInputProps('smartMeasurable')}
                />

                <Textarea
                  label="Achievable"
                  description="Is this realistic with your current schedule?"
                  placeholder="Yes, dedicating 1 hour every evening makes 5 per week very doable..."
                  autosize
                  minRows={2}
                  withAsterisk
                  {...form.getInputProps('smartAchievable')}
                />

                <Textarea
                  label="Relevant"
                  description="Why does this matter to you right now?"
                  placeholder="I need to increase my income to support my family's new home..."
                  autosize
                  minRows={2}
                  withAsterisk
                  {...form.getInputProps('smartRelevant')}
                />

                <Textarea
                  label="Time-bound"
                  description="When exactly will this be done?"
                  placeholder="By the end of Q4 (December 31st)..."
                  autosize
                  minRows={2}
                  withAsterisk
                  {...form.getInputProps('smartTimeBound')}
                />

                <NumberInput
                  label="Target Number (Optional)"
                  description="If this goal has a specific numeric target (e.g. 50 applications), enter it here to enable the progress bar."
                  placeholder="e.g. 50"
                  min={1}
                  {...form.getInputProps('targetValue')}
                />

                <Group justify="space-between" mt="sm">
                  <Button
                    variant="subtle"
                    color="arka"
                    onClick={() => {
                      setStep('choose-period')
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    color="arka"
                    loading={createGoal.isPending}
                  >
                    Save SMART Goal
                  </Button>
                </Group>
              </Stack>
            </form>
          </>
        )}
      </div>

      <footer className="squad-footer">
        <span>An Arka organization squad</span>
      </footer>
    </main>
  )
}

export default GoalSetup