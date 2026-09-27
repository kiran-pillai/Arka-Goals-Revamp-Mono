import { useState } from 'react'
import type { FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  Badge,
  Button,
  Container,
  Group,
  Select,
  Table,
  TextInput,
  Title,
  Text,
} from '@mantine/core'
import { api, ApiError } from '../lib/api'
import type { Role } from '../auth/auth'

interface Invite {
  id: string
  email: string
  role: Role
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED'
  createdAt: string
}

const INVITES_KEY = ['invites'] as const

const statusColor: Record<Invite['status'], string> = {
  PENDING: 'yellow',
  ACCEPTED: 'green',
  REVOKED: 'gray',
}

export default function AdminInvitesRoute() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('MEMBER')
  const [formError, setFormError] = useState('')

  const invites = useQuery({
    queryKey: INVITES_KEY,
    queryFn: () => api<Invite[]>('/invites'),
  })

  const createInvite = useMutation({
    mutationFn: (body: { email: string; role: Role }) =>
      api<Invite>('/invites', { method: 'POST', body }),
    onSuccess: () => {
      setEmail('')
      setRole('MEMBER')
      setFormError('')
      qc.invalidateQueries({ queryKey: INVITES_KEY })
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiError ? err.message : 'Failed to create invite.',
      )
    },
  })

  const revokeInvite = useMutation({
    mutationFn: (id: string) => api(`/invites/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: INVITES_KEY }),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFormError('Please enter a valid email address.')
      return
    }
    createInvite.mutate({ email: trimmed, role })
  }

  return (
    <Container size="sm" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Invites</Title>
        <Button variant="subtle" color="arka" onClick={() => navigate({ to: '/' })}>
          Back
        </Button>
      </Group>

      <form onSubmit={handleSubmit}>
        <Group align="flex-end" gap="sm">
          <TextInput
            label="Email"
            placeholder="teammate@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.currentTarget.value)
              if (formError) setFormError('')
            }}
            style={{ flex: 1 }}
            error={formError || undefined}
          />
          <Select
            label="Role"
            data={['MEMBER', 'ADMIN']}
            value={role}
            onChange={(v) => setRole((v as Role) ?? 'MEMBER')}
            allowDeselect={false}
            w={130}
          />
          <Button type="submit" color="arka" loading={createInvite.isPending}>
            Send invite
          </Button>
        </Group>
      </form>

      <Table mt="xl" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Email</Table.Th>
            <Table.Th>Role</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {invites.isLoading && (
            <Table.Tr>
              <Table.Td colSpan={4}>
                <Text c="dimmed">Loading…</Text>
              </Table.Td>
            </Table.Tr>
          )}
          {invites.data?.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={4}>
                <Text c="dimmed">No invites yet.</Text>
              </Table.Td>
            </Table.Tr>
          )}
          {invites.data?.map((inv) => (
            <Table.Tr key={inv.id}>
              <Table.Td>{inv.email}</Table.Td>
              <Table.Td>{inv.role}</Table.Td>
              <Table.Td>
                <Badge color={statusColor[inv.status]} variant="light">
                  {inv.status}
                </Badge>
              </Table.Td>
              <Table.Td>
                {inv.status === 'PENDING' && (
                  <Button
                    variant="subtle"
                    color="red"
                    size="xs"
                    onClick={() => revokeInvite.mutate(inv.id)}
                    loading={
                      revokeInvite.isPending && revokeInvite.variables === inv.id
                    }
                  >
                    Revoke
                  </Button>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Container>
  )
}
