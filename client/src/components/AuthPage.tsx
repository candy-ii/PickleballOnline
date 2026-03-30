import { useState, type ChangeEvent, type FC, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { AuthUser } from '../types/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

type AuthMode = 'login' | 'signup'
type SignupRole = 'player' | 'organizer'

interface AuthPageProps {
  mode: AuthMode
  onAuthenticated: (user: AuthUser) => void
}

interface LoginFormState {
  email: string
  password: string
}

interface SignupFormState {
  role: SignupRole
  email: string
  password: string
  name: string
  age: string
}

const inputClassName =
  'w-full rounded-2xl border border-[#1a3a1a]/12 bg-white px-4 py-3 text-sm text-[#1d241f] shadow-sm outline-none transition focus:border-[#2d5a27] focus:ring-2 focus:ring-[#2d5a27]/18'

const AuthPage: FC<AuthPageProps> = ({ mode, onAuthenticated }) => {
  const navigate = useNavigate()
  const [loginForm, setLoginForm] = useState<LoginFormState>({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState<SignupFormState>({
    role: 'player',
    email: '',
    password: '',
    name: '',
    age: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateLoginField = (field: keyof LoginFormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setLoginForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const updateSignupField =
    (field: keyof SignupFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value as SignupFormState[keyof SignupFormState]
      setSignupForm((current) => ({ ...current, [field]: value }))
    }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })

      const data = (await response.json()) as AuthUser | { error?: string }

      if (!response.ok || !('userId' in data)) {
        throw new Error('error' in data && data.error ? data.error : 'Unable to log in')
      }

      onAuthenticated(data)
      navigate('/dashboard/player')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to log in')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (signupForm.role !== 'player') return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup/player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupForm.email,
          password: signupForm.password,
          name: signupForm.name,
          age: Number(signupForm.age),
        }),
      })

      const data = (await response.json()) as AuthUser | { error?: string }

      if (!response.ok || !('userId' in data)) {
        throw new Error('error' in data && data.error ? data.error : 'Unable to sign up')
      }

      onAuthenticated(data)
      navigate('/dashboard/player')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to sign up')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-[#b8cfb8] px-6 py-10"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] bg-[#f6f8f2] shadow-[0_24px_50px_rgba(26,58,26,0.18)] md:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-[#1a3a1a] px-8 py-10 text-white md:px-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-green-300">
              Pickleball Online
            </p>
            <Link
              to="/"
              className="mt-3 inline-block text-sm font-semibold text-white/92 underline-offset-4 transition hover:text-white hover:underline"
            >
              Back to home
            </Link>
            <h1 className="mt-6 text-4xl font-bold leading-tight">
              {mode === 'login' ? 'Welcome back.' : 'Create your player account.'}
            </h1>
            <p className="mt-4 max-w-sm text-base leading-7 text-white/74">
              {mode === 'login'
                ? 'Log in to see your current stats, account status, and upcoming tournaments in one place.'
                : 'Register and play your first pickleball matches and build up your rank and recognition.'}
            </p>
          </div>

          <div className="px-6 py-8 sm:px-8 md:px-10">
            {mode === 'login' ? (
              <form className="space-y-5" onSubmit={handleLogin}>
                <div>
                  <h2 className="text-3xl font-bold text-[#1a3a1a]">Log In</h2>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#1a3a1a]">Email</span>
                  <input
                    className={inputClassName}
                    type="email"
                    value={loginForm.email}
                    onChange={updateLoginField('email')}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#1a3a1a]">Password</span>
                  <input
                    className={inputClassName}
                    type="password"
                    value={loginForm.password}
                    onChange={updateLoginField('password')}
                    required
                  />
                </label>

                {error && <p className="text-sm font-medium text-[#9e2f2f]">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-[#1a3a1a] px-5 py-3 text-sm font-bold tracking-wide text-white transition hover:bg-[#2d5a27] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'LOGGING IN...' : 'LOG IN'}
                </button>

                <p className="text-sm text-[#516353]">
                  Not a user?{' '}
                  <Link className="font-semibold text-[#1a3a1a]" to="/auth/signup">
                    Register
                  </Link>
                </p>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handleSignup}>
                <div>
                  <h2 className="text-3xl font-bold text-[#1a3a1a]">Sign Up</h2>
                  <p className="mt-2 text-sm text-[#516353]">I want to join as a...</p>
                </div>

                <div className="flex gap-3">
                  <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-2xl border border-[#1a3a1a]/10 bg-white px-4 py-3 text-sm font-semibold text-[#1a3a1a]">
                    <input
                      type="radio"
                      name="role"
                      value="player"
                      checked={signupForm.role === 'player'}
                      onChange={updateSignupField('role')}
                    />
                    Player
                  </label>
                  <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-2xl border border-[#1a3a1a]/10 bg-white px-4 py-3 text-sm font-semibold text-[#1a3a1a]">
                    <input
                      type="radio"
                      name="role"
                      value="organizer"
                      checked={signupForm.role === 'organizer'}
                      onChange={updateSignupField('role')}
                    />
                    Organizer
                  </label>
                </div>

                {signupForm.role === 'player' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-[#1a3a1a]">Name</span>
                        <input
                          className={inputClassName}
                          type="text"
                          value={signupForm.name}
                          onChange={updateSignupField('name')}
                          required
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-[#1a3a1a]">Age</span>
                        <input
                          className={inputClassName}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={signupForm.age}
                          onChange={updateSignupField('age')}
                          required
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#1a3a1a]">Email</span>
                      <input
                        className={inputClassName}
                        type="email"
                        value={signupForm.email}
                        onChange={updateSignupField('email')}
                        required
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#1a3a1a]">Password</span>
                      <input
                        className={inputClassName}
                        type="password"
                        value={signupForm.password}
                        onChange={updateSignupField('password')}
                        required
                      />
                    </label>

                    {error && <p className="text-sm font-medium text-[#9e2f2f]">{error}</p>}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-full bg-[#1a3a1a] px-5 py-3 text-sm font-bold tracking-wide text-white transition hover:bg-[#2d5a27] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                    </button>
                  </>
                ) : null}

                <p className="text-sm text-[#516353]">
                  Already have an account?{' '}
                  <Link className="font-semibold text-[#1a3a1a]" to="/auth/login">
                    Log in
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
