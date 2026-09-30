import { useState, useEffect } from 'react'
import { TextInput, Button, Stack, Title, Alert, Text, Paper } from '@mantine/core'
import { supabase } from './lib/supabase'
import { useAuth } from './auth/AuthContext'

export default function ManageProfile() {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadProfile() {
      if (!user) return
      const { data, error } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', user.id)
        .single()
        
      if (data?.display_name) {
        setDisplayName(data.display_name)
      }
    }
    loadProfile()
  }, [user])

  async function saveProfile() {
    if (!user) return
    setLoading(true)
    setMessage('')
    
    const { error } = await supabase
      .from('users')
      .update({ display_name: displayName })
      .eq('id', user.id)
      
    setLoading(false)
    if (error) {
      setMessage('Error saving profile. Please try again.')
    } else {
      setMessage('Profile updated successfully!')
    }
  }

  return (
    <main className="squad-screen">
      <Paper p="xl" radius="md" withBorder className="squad-card" mt="xl" maw={500} mx="auto">
        <Title order={2} mb="xs">Manage Profile</Title>
        <Text c="dimmed" mb="lg">Update your display name for the squad dashboard.</Text>
        
        <Stack gap="md">
          <TextInput 
            label="Display Name" 
            placeholder="e.g. Mike" 
            value={displayName} 
            onChange={(e) => setDisplayName(e.currentTarget.value)} 
          />
          <Button color="arka" onClick={saveProfile} loading={loading}>
            Save Changes
          </Button>
          {message && (
            <Alert color={message.includes('Error') ? 'red' : 'green'} variant="light">
              {message}
            </Alert>
          )}
        </Stack>
      </Paper>
    </main>
  )
}