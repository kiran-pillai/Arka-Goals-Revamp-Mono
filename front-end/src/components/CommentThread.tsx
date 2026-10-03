import { useState } from 'react'
import { Box, Button, Group, Stack, Text, Textarea } from '@mantine/core'
import type { Comment } from '../checkin'
import { getAvatarColor, getInitials } from '../lib/avatar-color'

type Props = {
  comments: Comment[]
  onAddComment: (text: string) => void
  onDeleteComment: (id: string) => void
}

export default function CommentThread({ comments, onAddComment, onDeleteComment }: Props) {
  const [text, setText] = useState('')

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onAddComment(trimmed)
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Stack gap="sm">
      {comments.length === 0 ? (
        <Text size="sm" c="dimmed">
          No comments yet
        </Text>
      ) : (
        comments.map((c) => {
          const color = getAvatarColor(c.user.colorSlot)
          const initials = getInitials(c.user.firstName, c.user.lastName, c.user.email)
          const name =
            c.user.firstName && c.user.lastName
              ? `${c.user.firstName} ${c.user.lastName}`
              : c.user.email

          return (
            <Group key={c.id} gap="sm" align="flex-start" wrap="nowrap">
              <Box
                data-testid="comment-avatar"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 11,
                  color: '#fff',
                  flexShrink: 0,
                  backgroundColor: color,
                }}
              >
                {initials}
              </Box>

              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={600}>
                  {name}
                </Text>
                <Text size="sm" c="dimmed">
                  {c.text}
                </Text>
              </Box>
            </Group>
          )
        })
      )}

      <Group gap="sm" align="flex-start">
        <Textarea
          placeholder="Add a comment..."
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          autosize
          minRows={1}
          style={{ flex: 1 }}
        />
        <Button onClick={handleSend}>Send</Button>
      </Group>
    </Stack>
  )
}
