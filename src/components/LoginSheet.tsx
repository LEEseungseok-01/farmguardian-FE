import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApp } from '../state/AppState'
import { Sheet } from './Sheet'
import './SignupSheet.css'

/** 이미 가입한 사람이 아이디와 비밀번호로 들어온다 (POST /auth/login) */
export function LoginSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { signIn } = useApp()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      const me = await api<{ id: number; username: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      signIn({ id: me.id, username: me.username })
      navigate('/map')
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="로그인"
      footer={
        <div className="sheet-actions">
          <button
            type="button"
            className="btn btn--primary btn--lg"
            disabled={busy || !username || !password}
            onClick={submit}
          >
            {busy ? '로그인하는 중…' : '로그인'}
          </button>
        </div>
      }
    >
      <form
        className="find-step"
        onSubmit={(e) => {
          e.preventDefault()
          if (username && password && !busy) submit()
        }}
      >
        <label className="field">
          <span className="field__label">아이디</span>
          <input
            className="input"
            value={username}
            maxLength={100}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            data-autofocus
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">비밀번호</span>
          <input
            className="input"
            type="password"
            value={password}
            maxLength={100}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" hidden />
        {error && (
          <p className="signup-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </Sheet>
  )
}
