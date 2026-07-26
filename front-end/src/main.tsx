import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, createTheme } from '@mantine/core'
import '@mantine/core/styles.css'
import './index.css'
import App from './App.tsx'

// Amber/bronze "Arka / Cheetah Squad" palette (light -> dark ramp).
const theme = createTheme({
  primaryColor: 'arka',
  colors: {
    arka: [
      '#fff7e6',
      '#ffedcc',
      '#fada9c',
      '#f5c568',
      '#f0b849',
      '#e6a532',
      '#d08a3a',
      '#a85f22',
      '#8a4e1e',
      '#5a3a1c',
    ],
  },
  fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif',
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <App />
    </MantineProvider>
  </StrictMode>,
)
