import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, createTheme } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import '@mantine/core/styles.css'
import './index.css'
import { router } from './router'
import { AuthProvider, useAuth } from './auth/AuthContext'

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

const queryClient = new QueryClient()

/**
 * Feeds the live auth state into the router context so route `beforeLoad`
 * guards see the current user. While /auth/me is loading we render nothing to
 * avoid a flash of the login screen before auth resolves.
 */
function RoutedApp() {
  const { user, loading } = useAuth()
  if (loading) return null
  return <RouterProvider router={router} context={{ auth: { user } }} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RoutedApp />
        </AuthProvider>
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
)
