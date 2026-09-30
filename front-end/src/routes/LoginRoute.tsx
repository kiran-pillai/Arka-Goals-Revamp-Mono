import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import '../Login.css'

export default function LoginRoute() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }

    setError('')
    setStatus('loading')

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setStatus('idle')
    } else {
      setStatus('sent')
    }
  }

  const sent = status === 'sent'
  const isPending = status === 'loading'

  return (
    <main className="login">
      <div className="login-card">
        <header className="brand">
          <img className="brand-arka" src="/images/Arka_Icon.webp" alt="Arka" />
          <span className="brand-org">ARKA</span>
        </header>

        <div className="squad">
          <div className="squad-portrait">
            <img src="/images/TheCheethcat.webp" alt="Cheetah Squad" />
          </div>
          <h1 className="squad-name">Cheetah Squad</h1>
          <p className="squad-tag">Q4 Goals Cup &middot; Lock in.</p>
        </div>

        {sent ? (
          <div className="sent" role="status">
            <svg className="sent-check" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M20 6 9 17l-5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h2>Check your email</h2>
            <p>
              If <strong>{email.trim()}</strong> is on the Cheetah Squad roster,
              a sign-in link is on its way. Tap it to enter.
            </p>
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setStatus('idle')
                setEmail('')
                setError('')
              }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="email">Sign in with your email</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              aria-invalid={Boolean(error)}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError('')
              }}
            />
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="submit" disabled={isPending}>
              {isPending ? 'Sending…' : 'Send my sign-in link'}
            </button>
            <p className="hint">
              Cheetah Squad is invite-only. We&rsquo;ll email you a secure
              link&mdash; no password to remember.
            </p>
          </form>
        )}
      </div>

      <footer className="login-footer">
        <span>An Arka organization squad</span>
      </footer>
    </main>
  )
}