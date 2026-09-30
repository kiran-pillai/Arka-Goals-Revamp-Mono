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
  Divider,
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
  const [rawGoal, setRawGoal] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiError, setAiError] = useState('')
  
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

  async function generateSmartGoal() {
    if (!rawGoal.trim()) return
    setIsGenerating(true)
    setAiError('')
    
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) throw new Error('Missing Gemini API Key in .env.local')

      const prompt = `Convert this raw goal into a practical, realistic SMART goal breakdown. Return ONLY valid JSON with exactly these 5 string keys: "smartSpecific", "smartMeasurable", "smartAchievable", "smartRelevant", "smartTimeBound". Do not include markdown formatting, backticks, or any other text. Raw goal: "${rawGoal}"`

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      })

      if (!res.ok) {
        const errorBody = await res.text()
        console.error('Google API Error:', errorBody)
        throw new Error(`AI rejected the request (${res.status}). Check browser console for details.`)
      }
      
      const data = await res.json()
      let jsonText = data.candidates[0].content.parts[0].text

      // Strip out markdown code blocks if the AI includes them anyway
      jsonText = jsonText.replace(/```json/gi, '').replace(/```/g, '').trim()
      
      const parsed = JSON.parse(jsonText)

      form.setValues({
        ...form.values,
        smartSpecific: parsed.smartSpecific || '',
        smartMeasurable: parsed.smartMeasurable || '',
        smartAchievable: parsed.smartAchievable || '',
        smartRelevant: parsed.smartRelevant || '',
        smartTimeBound: parsed.smartTimeBound || '',
      })
    } catch (err: any) {
      console.error('AI Generation caught error:', err)
      setAiError(err.message || 'Failed to generate SMART criteria. Try again.')
    } finally {
      setIsGenerating(false)
    }
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
              <path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <Title order={2}>Goal saved</Title>
            <Text c="dimmed">Your {form.values.type.toLowerCase()} goal is locked in. Stay accountable.</Text>
            <Group mt="sm" gap="sm" justify="center">
              <Button color="arka" onClick={onViewGoals}>View goals</Button>
              <Button variant="light" color="arka" onClick={() => { setSubmitted(false); form.reset(); setStep('choose-period') }}>
                Add another goal
              </Button>
            </Group>
          </div>
        ) : step === 'choose-period' ? (
          <>
            <Title order={1} mt="xl" mb={4} fz={34}>Set Your Goals</Title>
            <Text c="dimmed" mb="md">First things first — choose your goal cadence.</Text>
            <Text fw={600} size="lg">Monthly or Quarterly?</Text>
            <Text size="sm" c="dimmed" mt={4}>You can choose one or the other, not both. Monthly goals are set fresh each month. A quarterly goal spans the full quarter.</Text>
            <Group justify="center" gap="md" mt="xl">
              <Button color="arka" size="lg" radius="md" w={180} onClick={() => handlePeriodNext('MONTHLY')}>Monthly</Button>
              <Button variant="light" color="arka" size="lg" radius="md" w={180} onClick={() => handlePeriodNext('QUARTERLY')}>Quarterly</Button>
            </Group>
            <Group justify="flex-start" mt="lg">
              <Button variant="subtle" color="arka" size="sm" onClick={onBack}>Back</Button>
            </Group>
          </>
        ) : (
          <>
            <Title order={1} mt="xl" mb={4} fz={34}>New {form.values.type === 'QUARTERLY' ? 'Quarterly' : 'Monthly'} Goal</Title>
            <Text c="dimmed" mb="xl">Break it down. SMART goals are Specific, Measurable, Achievable, Relevant, and Time-bound.</Text>

            <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
              <Stack gap="lg">
                {createGoal.isError && <Alert color="red" variant="light">{(createGoal.error as Error)?.message ?? "Couldn’t save your goal. Please try again."}</Alert>}

                <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <Text fw={600} mb="xs">AI Goal Refiner</Text>
                  <Text size="sm" c="dimmed" mb="md">Describe what you want to do in plain English, and AI will structure it into a SMART framework below.</Text>
                  <Textarea
                    placeholder="e.g. I want to start running and get in shape for a 5k..."
                    minRows={2}
                    autosize
                    value={rawGoal}
                    onChange={(e) => setRawGoal(e.currentTarget.value)}
                    mb="sm"
                  />
                  <Button 
                    variant="light" 
                    color="arka" 
                    onClick={generateSmartGoal} 
                    loading={isGenerating}
                    disabled={!rawGoal.trim()}
                  >
                    Generate SMART Breakdown
                  </Button>
                  {aiError && <Text color="red" size="sm" mt="xs">{aiError}</Text>}
                </div>

                <Divider my="sm" />

                <TextInput label="Goal Title" placeholder="e.g. Run a 5k" withAsterisk {...form.getInputProps('title')} />
                <Textarea label="Specific" autosize minRows={2} withAsterisk {...form.getInputProps('smartSpecific')} />
                <Textarea label="Measurable" autosize minRows={2} withAsterisk {...form.getInputProps('smartMeasurable')} />
                <Textarea label="Achievable" autosize minRows={2} withAsterisk {...form.getInputProps('smartAchievable')} />
                <Textarea label="Relevant" autosize minRows={2} withAsterisk {...form.getInputProps('smartRelevant')} />
                <Textarea label="Time-bound" autosize minRows={2} withAsterisk {...form.getInputProps('smartTimeBound')} />
                <NumberInput label="Target Number (Optional)" description="If this goal has a specific numeric target, enter it here." min={1} {...form.getInputProps('targetValue')} />

                <Group justify="space-between" mt="sm">
                  <Button variant="subtle" color="arka" onClick={() => setStep('choose-period')}>Back</Button>
                  <Button type="submit" color="arka" loading={createGoal.isPending}>Save SMART Goal</Button>
                </Group>
              </Stack>
            </form>
          </>
        )}
      </div>
    </main>
  )
}

export default GoalSetup