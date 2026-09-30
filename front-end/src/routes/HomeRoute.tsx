import { useState } from 'react'
import { Button, Group, Stack, Text } from '@mantine/core'
import { useNavigate } from '@tanstack/react-router'
import WeeklyCheckIn from '../WeeklyCheckIn'
import CheckInsTable from '../CheckInsTable'
import GoalSetup from '../GoalSetup'
import GoalsTable from '../GoalsTable'
import { useAuth } from '../auth/AuthContext'
import '../WeeklyCheckIn.css'
import '../App.css'

type View = 'landing' | 'form' | 'table' | 'goals-setup' | 'goals-table'

export default function HomeRoute() {
  const [view, setView] = useState<View>('landing')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (view === 'form') {
    return (
      <WeeklyCheckIn
        onBack={() => setView('landing')}
        onViewCheckIns={() => setView('table')}
      />
    )
  }

  if (view === 'table') {
    return (
      <CheckInsTable
        onAddAnother={() => setView('form')}
        onBack={() => setView('landing')}
      />
    )
  }

  if (view === 'goals-setup') {
    return (
      <GoalSetup
        onBack={() => setView('landing')}
        onViewGoals={() => setView('goals-table')}
      />
    )
  }

  if (view === 'goals-table') {
    return (
      <GoalsTable
        onAddGoal={() => setView('goals-setup')}
        onBack={() => setView('landing')}
      />
    )
  }

  return (
    <main className="squad-screen">
      <div className="squad-card is-landing">
        <header className="brand">
          <img className="brand-arka" src="/images/Arka_Icon.webp" alt="Arka" />
          <span className="brand-org">ARKA</span>
        </header>

        <div className="squad">
          <div className="squad-portrait">
            <img src="/images/TheCheethcat.webp" alt="Cheetah Squad" />
          </div>
          <h1 className="squad-name">Cheetah Squad</h1>
          <p className="squad-tag">Q4 Goals Cup &middot; Lock in.</p>
        </div>

        {user && (
          <Text size="sm" c="dimmed" ta="center" mt="md">
            Signed in as <strong>{user.email}</strong>
          </Text>
        )}

        {/* One shared width and size so both buttons align on all four edges. */}
        <Stack gap="sm" mt="xl" mx="auto" maw={320}>
          <Button
            color="arka"
            size="lg"
            radius="md"
            fullWidth
            onClick={() => setView('form')}
          >
            Enter Weekly Form
          </Button>

          <Button
            variant="light"
            color="arka"
            size="lg"
            radius="md"
            fullWidth
            onClick={() => setView('table')}
          >
            View check-ins
          </Button>

          <Button
            color="arka"
            size="lg"
            radius="md"
            fullWidth
            onClick={() => setView('goals-setup')}
          >
            Set Goals
          </Button>

          <Button
            variant="light"
            color="arka"
            size="lg"
            radius="md"
            fullWidth
            onClick={() => setView('goals-table')}
          >
            View Goals
          </Button>
        </Stack>

        <Group justify="center" mt="lg" gap="xs">
          {user?.role === 'ADMIN' && (
            <Button
              variant="subtle"
              color="arka"
              size="sm"
              onClick={() => navigate({ to: '/admin/invites' })}
            >
              Manage invites
            </Button>
          )}
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            onClick={async () => {
              await logout()
              navigate({ to: '/login' })
            }}
          >
            Sign out
          </Button>
        </Group>
      </div>

      <footer className="squad-footer">
        <span>An Arka organization squad</span>
      </footer>
    </main>
  )
}
