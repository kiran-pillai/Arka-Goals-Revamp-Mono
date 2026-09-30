import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Center, Loader, Stack, Text } from '@mantine/core'
import { useAuth } from '../auth/AuthContext'

export default function AuthCallbackRoute() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    // Supabase automatically parses the URL and sets the session behind the scenes.
    // Once the user object populates, redirect to home.
    if (user) {
      navigate({ to: '/' })
    }
  }, [user, navigate])

  return (
    <Center h="100vh">
      <Stack align="center" gap="sm">
        <Loader color="arka" />
        <Text c="dimmed">Authenticating securely…</Text>
      </Stack>
    </Center>
  )
}