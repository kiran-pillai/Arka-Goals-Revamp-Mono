import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Group,
  Radio,
  Stack,
  Text,
  Textarea,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { IconStar, IconStarFilled } from '@tabler/icons-react'
import { useForm } from '@mantine/form'
import { useNavigate } from '@tanstack/react-router'
import { useCreateCheckIn } from './lib/checkins'

type FormValues = {
  completedGoal: '' | 'yes' | 'no'
  rating: number
  results: string
  commitments: string
  wins: string
  frictions: string
}

export default function WeeklyCheckIn() {
  const [submitted, setSubmitted] = useState(false)
  const createCheckIn = useCreateCheckIn()
  const navigate = useNavigate()

  const form = useForm<FormValues>({
    initialValues: {
      completedGoal: '',
      rating: 0,
      results: '',
      commitments: '',
      wins: '',
      frictions: '',
    },
    validate: {
      completedGoal: (value) =>
        value ? null : 'Let us know if you completed your goal.',
      results: (v) => (v.trim() ? null : 'Results are required'),
      commitments: (v) => (v.trim() ? null : 'Commitments are required'),
      wins: (v) => (v.trim() ? null : 'This field is required'),
      frictions: (v) => (v.trim() ? null : 'This field is required'),
      rating: (v) => (v >= 1 && v <= 5 ? null : 'Rating is required'),
    },
  })

  function handleSubmit(values: FormValues) {
    createCheckIn.mutate(
      {
        completedGoal: values.completedGoal === 'yes',
        rating: values.rating,
        results: values.results,
        commitments: values.commitments,
        wins: values.wins,
        frictions: values.frictions,
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
        <Title order={2}>Check-in submitted</Title>
        <Text c="dimmed">
          Thanks for logging your week, Cheetah Squad. Keep the momentum.
        </Text>
        <Button color="arka" mt="sm" onClick={() => navigate({ to: '/' })}>
          View check-ins
        </Button>
      </Stack>
    )
  }

  return (
    <>
      <Title order={1} mb={4} fz={34}>
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
            withAsterisk
            {...form.getInputProps('results')}
          />

          <Textarea
            label="What actions are you committing to THIS WEEK?"
            description="To be completed by Monday at Noon."
            placeholder="List the actions you're committing to..."
            autosize
            minRows={3}
            withAsterisk
            {...form.getInputProps('commitments')}
          />

          <Textarea
            label="What went well last week?"
            description="Wins to celebrate."
            placeholder="Share your wins..."
            autosize
            minRows={3}
            withAsterisk
            {...form.getInputProps('wins')}
          />

          <Textarea
            label="What did NOT go well last week?"
            description="What caused friction, got in your way, or is an area of improvement for next week."
            placeholder="What got in your way..."
            autosize
            minRows={3}
            withAsterisk
            {...form.getInputProps('frictions')}
          />

          <Box>
            <Text fw={500} size="sm" mb={4}>Performance Rating (1 = Poor, 5 = Outstanding)</Text>
            <Group mt={5} gap={4}>
              {[1, 2, 3, 4, 5].map((star) => (
                <UnstyledButton
                  key={star}
                  onClick={() => form.setFieldValue('rating', star)}
                  style={{ lineHeight: 1 }}
                >
                  {star <= form.values.rating ? (
                    <IconStarFilled size={32} color="var(--mantine-color-arka-4)" />
                  ) : (
                    <IconStar size={32} color="var(--mantine-color-dimmed)" style={{ opacity: 0.4 }} />
                  )}
                </UnstyledButton>
              ))}
            </Group>
            {form.errors.rating && (
              <Text size="xs" c="red" mt={4}>{form.errors.rating}</Text>
            )}
          </Box>

          <Group justify="flex-end" mt="sm">
            <Button type="submit" color="arka" loading={createCheckIn.isPending}>
              Submit check-in
            </Button>
          </Group>
        </Stack>
      </form>
    </>
  )
}
