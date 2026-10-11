import { Text } from '@mantine/core'

/** Show creation dates in the viewer's local timezone. */
export default function CreatedTimestamp({ value }: { value: string }) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return (
    <Text component="time" dateTime={date.toISOString()} size="xs" c="dimmed">
      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      {' · '}
      {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short' })}
    </Text>
  )
}
