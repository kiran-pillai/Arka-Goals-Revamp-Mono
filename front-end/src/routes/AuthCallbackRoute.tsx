import { useEffect, useRef } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { Center, Loader, Stack, Text, Button } from '@mantine/core'
import { api } from '../lib/api'
import { useAuth } from '../auth/AuthContext'

export default function AuthCallbackRoute() {
  const { token } = useSearch({ from: '/auth/callback' })
  const navigate = useNavigate()
  const { refresh, user } = useAuth()
  const ran = useRef(false)

  const verify = useMutation({
    mutationFn: (t: string) =>
      api('/auth/verify', { method: 'POST', body: { token: t } }),
    onSuccess: async () => {
      await refresh()
    },
  })

  useEffect(()=>{
    if(user){
      navigate({ to: '/' })
    }
  }, [user, navigate])

  useEffect(() => {
    // Guard against React StrictMode double-invoke / single-use token.
    if (ran.current) return
    ran.current = true
    if (token) verify.mutate(token)
  }, [token])

  const failed = !token || verify.isError

  return (
    <Center h="100vh">
      {failed ? (
        <Stack align="center" gap="sm">
          <Text fw={600}>This sign-in link is invalid or has expired.</Text>
          <Button color="arka" onClick={() => navigate({ to: '/login' })}>
            Back to sign in
          </Button>
        </Stack>
      ) : (
        <Stack align="center" gap="sm">
          <Loader color="arka" />
          <Text c="dimmed">Signing you in…</Text>
        </Stack>
      )}
    </Center>
  )
}
