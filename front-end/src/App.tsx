import { useState } from 'react'
import { Button } from '@mantine/core'
import WeeklyCheckIn from './WeeklyCheckIn'
import CheckInsTable from './CheckInsTable'
import type { CheckIn } from './checkin'
import './WeeklyCheckIn.css'
import './App.css'

type View = 'landing' | 'form' | 'table'

function App() {
  const [view, setView] = useState<View>('landing')
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])

  if (view === 'form') {
    return (
      <WeeklyCheckIn
        onBack={() => setView('landing')}
        onSubmit={(checkIn) => setCheckIns((prev) => [...prev, checkIn])}
        onViewCheckIns={() => setView('table')}
      />
    )
  }

  if (view === 'table') {
    return (
      <CheckInsTable
        checkIns={checkIns}
        onAddAnother={() => setView('form')}
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
          <p className="squad-tag">Q3 Goals Cup &middot; Lock in.</p>
        </div>

        <Button
          color="arka"
          size="lg"
          mt="xl"
          radius="md"
          onClick={() => setView('form')}
        >
          Enter Weekly Form
        </Button>
      </div>

      <footer className="squad-footer">
        <span>An Arka organization squad</span>
      </footer>
    </main>
  )
}

export default App
