import { useState } from 'react'
import { Group, SegmentedControl, Stack, Text, Title } from '@mantine/core'
import { useCheckIns, useAddComment, useDeleteComment } from './lib/checkins'
import CheckInTimeline from './components/CheckInTimeline'

export default function CheckInsPage() {
  const [scope, setScope] = useState<'mine' | 'squad'>('mine')
  const checkIns = useCheckIns(scope === 'mine')
  const addComment = useAddComment()
  const deleteComment = useDeleteComment()

  return (
    <>
      <Stack gap="sm" mb="md">
        <Group justify="space-between" align="flex-end">
          <Title order={1} fz={30}>
            Squad Check-ins
          </Title>
        </Group>

        <SegmentedControl
          value={scope}
          onChange={(v) => setScope(v as 'mine' | 'squad')}
          data={[
            { label: 'My check-ins', value: 'mine' },
            { label: 'Whole squad', value: 'squad' },
          ]}
          color="arka"
        />
      </Stack>

      {checkIns.isLoading ? (
        <Stack align="center" py="xl">
          <Text c="dimmed">Loading…</Text>
        </Stack>
      ) : (checkIns.data ?? []).length === 0 ? (
        <Stack align="center" gap={4} py="xl">
          <Text fw={600}>No check-ins yet</Text>
          <Text c="dimmed" size="sm">
            Submit a weekly check-in and it'll show up here.
          </Text>
        </Stack>
      ) : (
        <CheckInTimeline
          checkIns={checkIns.data ?? []}
          onAddComment={(checkInId, text) =>
            addComment.mutate({ checkInId, text })
          }
          onDeleteComment={(checkInId, commentId) =>
            deleteComment.mutate({ checkInId, commentId })
          }
        />
      )}
    </>
  )
}
