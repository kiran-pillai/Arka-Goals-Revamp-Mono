import { useState } from 'react'
import {
  Alert,
  Button,
  Group,
  Radio,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  ActionIcon,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { randomId } from '@mantine/hooks'
import { useCreateCheckIn } from './lib/checkins'
import './WeeklyCheckIn.css'

type WeeklyCheckInProps = {
  onBack: () => void
  onViewCheckIns: () => void
}

type FormValues = {
  completedGoal: '' | 'yes' | 'no'
  results: string
  commitments: { text: string; key: string }[]
  wins: string
  frictions: string
}

function WeeklyCheckIn({ onBack, onViewCheckIns }: WeeklyCheckInProps) {
  const [submitted, setSubmitted] = useState(false)
  const createCheckIn = useCreateCheckIn()

  const form = useForm<FormValues>({
    initialValues: {
      completedGoal: '',
      results: '',
      commitments: [{ text: '', key: randomId() }],
      wins: '',
      frictions: '',
    },
    validate: {
      completedGoal: (value) =>
        value ? null : 'Let us know if you completed your goal.',
    },
  })

  function handleSubmit(values: FormValues) {
    createCheckIn.mutate(
      {
        completedGoal: values.completedGoal === 'yes',
        results: values.results,
        commitments: values.commitments.map((c) => c.text),
        wins: values.wins,
        frictions: values.frictions,
      },
      { onSuccess: () => setSubmitted(true) },
    )
  }

  const commitmentsList = form.values.commitments.map((item, index) => (
    <Group key={item.key} mt="xs" align="center" wrap="nowrap">
      <TextInput
        placeholder="e.g. Read 30 pages of DDIA"
        style={{ flex: 1 }}
        {...form.getInputProps(`commitments.${index}.text`)}
      />
      <ActionIcon 
        color="red" 
        variant="subtle" 
        onClick={() => form.removeListItem('commitments', index)}
        aria-label="Remove commitment"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </ActionIcon>
    </Group>
  ))

  return (
    <main className="squad-screen">
      <div className="squad-card">
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
            <Title order={2}>Check-in submitted</Title>
            <Text c="dimmed">
              Thanks for logging your week, Cheetah Squad. Keep the momentum.
            </Text>
            <Button color="arka" mt="sm" onClick={onViewCheckIns}>
              View check-ins
            </Button>
          </div>
        ) : (
          <>
            <Title order={1} mt="xl" mb={4} fz={34}>
              Weekly Check-in
            </Title>
            <Text c="dimmed" mb="xl">
              A few minutes of reflection to keep the squad on track.
            </Text>

            <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
              <Stack gap="lg">
                {createCheckIn.isError && (
                  <Alert color="red" variant="light">
                    Couldn&rsquo;t save your check-in. Please try again.
                  </Alert>
                )}

                <Radio.Group
                  label="Did you complete your weekly goal?"
                  withAsterisk
                  {...form.getInputProps('completedGoal')}
                >
                  <Group mt="xs">
                    <Radio value="yes" label="Yes" color="arka" />
                    <Radio value="no" label="No" color="arka" />
                  </Group>
                </Radio.Group>

                <Textarea
                  label="Results"
                  placeholder="What were the results?"
                  autosize
                  minRows={3}
                  {...form.getInputProps('results')}
                />

                <div>
                  <Text fw={500} size="sm">
                    What actions are you committing to THIS WEEK?
                  </Text>
                  <Text size="xs" c="dimmed" mb="sm">
                    To be completed by Monday at Noon.
                  </Text>
                  
                  {commitmentsList}
                  
                  <Group mt="md">
                    <Button
                      variant="outline"
                      color="arka"
                      size="xs"
                      onClick={() =>
                        form.insertListItem('commitments', {
                          text: '',
                          key: randomId(),
                        })
                      }
                    >
                      + Add commitment
                    </Button>
                  </Group>
                </div>

                <Textarea
                  label="What went well last week?"
                  description="Wins to celebrate."
                  placeholder="Share your wins..."
                  autosize
                  minRows={3}
                  {...form.getInputProps('wins')}
                />

                <Textarea
                  label="What did NOT go well last week?"
                  description="What caused friction, got in your way, or is an area of improvement for next week."
                  placeholder="What got in your way..."
                  autosize
                  minRows={3}
                  {...form.getInputProps('frictions')}
                />

                <Group justify="space-between" mt="sm">
                  <Button variant="subtle" color="arka" onClick={onBack}>
                    Back
                  </Button>
                  <Button type="submit" color="arka" loading={createCheckIn.isPending}>
                    Submit check-in
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

export default WeeklyCheckIn