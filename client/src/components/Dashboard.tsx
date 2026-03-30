import { useEffect, useState, type FC, type WheelEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { AuthUser } from '../types/auth'

// ── Icons ────────────────────────────────────────────────────────────────────

const SearchIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

const BellIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const FilterIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)

const ArrowIcon: FC<{ className?: string; direction: 'left' | 'right' }> = ({ className, direction }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    {direction === 'left' ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
  </svg>
)

const PeopleIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
)

const CalendarIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const PinIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

// ── Data ─────────────────────────────────────────────────────────────────────

interface Tournament {
  id: number
  name: string
  spotsLeft: number
  startLabel: string
  organizer: string
  canJoin: boolean
  imageBg: string
  kind?: 'tournament' | 'message'
}

interface LeaderboardPlayer {
  playerId: number
  position: number
  name: string
  totalScore: number
  championshipsWon: number
  winRate: number
}

interface TournamentsResponse {
  startingSoon: Array<{
    tournamentId: number
    title: string
    organizer: string
    spotsLeft: number
    organizerFee: number
    skillCap: number
    date: string
  }>
  futureTournaments: Array<{
    tournamentId: number
    title: string
    organizer: string
    spotsLeft: number
    organizerFee: number
    skillCap: number
    date: string
  }>
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const avatarPalette = ['5a8a5a', '4a7a6a', '6a9a7a', '3a6a5a', '4a6a4a', '6a8f54']
const tournamentPalette = ['3a6b35', '2d5a27', '4a7a40', '2a4a25', '1e3a1a', '3d6b38']
const visibleTournamentCards = 3

const getOrdinal = (position: number) => {
  const mod100 = position % 100
  if (mod100 >= 11 && mod100 <= 13) return `${position}th`

  switch (position % 10) {
    case 1:
      return `${position}st`
    case 2:
      return `${position}nd`
    case 3:
      return `${position}rd`
    default:
      return `${position}th`
  }
}

const getAvatarBg = (playerId: number) => avatarPalette[playerId % avatarPalette.length]
const getTournamentBg = (id: number) => tournamentPalette[id % tournamentPalette.length]

const formatStartLabel = (dateString: string) => {
  const today = new Date()
  const target = new Date(dateString)
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const diffDays = Math.round((targetStart.getTime() - todayStart.getTime()) / 86_400_000)

  if (diffDays <= 0) return 'TODAY'
  if (diffDays === 1) return 'TOMORROW'
  if (diffDays < 7) return `IN ${diffDays} DAYS`
  if (diffDays < 14) return 'IN 1 WEEK'
  if (diffDays >= 30) {
    const months = Math.max(1, Math.round(diffDays / 30))
    return `IN ${months} ${months === 1 ? 'MONTH' : 'MONTHS'}`
  }

  const weeks = Math.round(diffDays / 7)
  return `IN ${weeks} WEEKS`
}

const normalizeTournament = (tournament: TournamentsResponse['startingSoon'][number]): Tournament => ({
  id: tournament.tournamentId,
  name: tournament.title,
  spotsLeft: tournament.spotsLeft,
  startLabel: formatStartLabel(tournament.date),
  organizer: tournament.organizer,
  canJoin: tournament.spotsLeft > 0,
  imageBg: getTournamentBg(tournament.tournamentId),
  kind: 'tournament',
})

const getInitials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

const formatStatValue = (value: number, suffix = '') => (value === 0 ? 'N/A' : `${value}${suffix}`)
const formatCurrencyValue = (value: number) => (value === 0 ? 'N/A' : `$${value.toFixed(2)}`)
const getAccountStatusText = (accountStatus: string | null) =>
  accountStatus === 'Inactive'
    ? 'Account Status: Inactive. Activate by joining a tournament.'
    : `Account Status: ${accountStatus ?? 'N/A'}`

const createFilterMessageCard = (): Tournament => ({
  id: -1,
  name: "Not finding what you're looking for? Try filtering!",
  spotsLeft: 0,
  startLabel: '',
  organizer: '',
  canJoin: false,
  imageBg: 'dfe8dc',
  kind: 'message',
})

const TournamentCarousel: FC<{
  title: string
  tournaments: Tournament[]
  offset: number
  onMoveLeft: () => void
  onMoveRight: () => void
  onWheel: (event: WheelEvent<HTMLDivElement>) => void
  showEndMessage?: boolean
  requiresLogin?: boolean
}> = ({ title, tournaments, offset, onMoveLeft, onMoveRight, onWheel, showEndMessage = false, requiresLogin = false }) => {
  const items = showEndMessage ? [...tournaments, createFilterMessageCard()] : tournaments
  const maxOffset = Math.max(items.length - visibleTournamentCards, 0)
  const visibleCarouselItems = items.slice(offset, offset + visibleTournamentCards)

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-[#1a3a1a]">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Scroll ${title} left`}
            onClick={onMoveLeft}
            disabled={offset === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a3a1a]/18 text-[#1a3a1a] shadow-sm backdrop-blur-sm transition hover:bg-[#1a3a1a]/28 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ArrowIcon direction="left" className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={`Scroll ${title} right`}
            onClick={onMoveRight}
            disabled={offset >= maxOffset + 1}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a3a1a]/18 text-[#1a3a1a] shadow-sm backdrop-blur-sm transition hover:bg-[#1a3a1a]/28 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ArrowIcon direction="right" className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div onWheel={onWheel} className="grid grid-cols-3 gap-5">
        {visibleCarouselItems.map((t) => (
          <TournamentCard key={`${t.kind ?? 'tournament'}-${t.id}`} t={t} requiresLogin={requiresLogin} />
        ))}
      </div>
    </section>
  )
}

// ── Tournament Card ───────────────────────────────────────────────────────────

const TournamentCard: FC<{ t: Tournament; requiresLogin?: boolean }> = ({ t, requiresLogin = false }) => {
  const navigate = useNavigate()

  const handleTournamentAction = () => {
    if (requiresLogin) {
      navigate('/auth/login')
    }
  }

  return (
  <div className="bg-white rounded-2xl shadow-md flex flex-col transition-all duration-200 hover:scale-[1.03] hover:shadow-xl cursor-pointer">
    {t.kind === 'message' ? (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-lg font-semibold text-[#1a3a1a]">
          {t.name}
      </div>
    ) : (
      <>
        <img
          src={`https://placehold.co/400x160/${t.imageBg}/6aaa60?text=`}
          alt={t.name}
          className="w-full h-40 object-cover rounded-t-2xl"
        />
        <div className="p-4 flex flex-col gap-2 flex-1">
          <h3 className="font-bold text-base text-center text-gray-900 leading-tight">{t.name}</h3>

          <div className="flex items-center justify-between text-xs font-semibold gap-2">
            <span className="flex items-center gap-1 text-green-600 whitespace-nowrap">
              <PeopleIcon className="w-3.5 h-3.5 shrink-0" />
              {t.spotsLeft} SPOTS LEFT
            </span>
            <span className="flex items-center gap-1 text-gray-700 whitespace-nowrap">
              <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
              STARTS {t.startLabel}
            </span>
          </div>

          <p className="flex items-center gap-1 text-xs text-gray-500">
            <PinIcon className="w-3.5 h-3.5 shrink-0" />
            Organized by {t.organizer}
          </p>

          <div className="mt-auto pt-2">
            {t.canJoin ? (
              <button
                type="button"
                onClick={handleTournamentAction}
                className="w-full bg-[#1a3a1a] text-white rounded-full py-2 text-sm font-bold hover:bg-[#2d5a27] transition-colors cursor-pointer"
              >
                JOIN NOW
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTournamentAction}
                className="w-full bg-[#7a8a6a] text-white rounded-full py-2 text-sm font-bold hover:bg-[#8a9a7a] transition-colors cursor-pointer"
              >
                JOIN WAITLIST
              </button>
            )}
          </div>
        </div>
      </>
    )}
  </div>
)
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

interface DashboardProps {
  currentUser: AuthUser | null
  onLogout: () => void
}

const Dashboard: FC<DashboardProps> = ({ currentUser, onLogout }) => {
  const navigate = useNavigate()
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([])
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null)
  const [startingSoon, setStartingSoon] = useState<Tournament[]>([])
  const [futureTournaments, setFutureTournaments] = useState<Tournament[]>([])
  const [tournamentsError, setTournamentsError] = useState<string | null>(null)
  const [startingSoonOffset, setStartingSoonOffset] = useState(0)
  const [futureOffset, setFutureOffset] = useState(0)

  const maxStartingSoonOffset = Math.max(startingSoon.length + 1 - visibleTournamentCards, 0)
  const maxFutureOffset = Math.max(futureTournaments.length - visibleTournamentCards, 0)

  useEffect(() => {
    const controller = new AbortController()

    const loadDashboardData = async () => {
      try {
        setLeaderboardError(null)
        setTournamentsError(null)

        const [leaderboardResponse, tournamentsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/leaderboard`, { signal: controller.signal }),
          fetch(`${API_BASE_URL}/api/tournaments`, { signal: controller.signal }),
        ])

        if (!leaderboardResponse.ok) {
          throw new Error(`Leaderboard request failed with ${leaderboardResponse.status}`)
        }

        if (!tournamentsResponse.ok) {
          throw new Error(`Tournaments request failed with ${tournamentsResponse.status}`)
        }

        const leaderboardData = (await leaderboardResponse.json()) as LeaderboardPlayer[]
        const tournamentsData = (await tournamentsResponse.json()) as TournamentsResponse

        setLeaderboard(leaderboardData)
        setStartingSoon(tournamentsData.startingSoon.map(normalizeTournament))
        setFutureTournaments(tournamentsData.futureTournaments.map(normalizeTournament))
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.error('Failed to fetch leaderboard:', error)
        setLeaderboardError('Unable to load leaderboard')
        setTournamentsError('Unable to load tournaments')
      }
    }

    void loadDashboardData()

    return () => controller.abort()
  }, [])

  const moveStartingSoon = (direction: -1 | 1) => {
    setStartingSoonOffset((current) => Math.min(Math.max(current + direction, 0), maxStartingSoonOffset))
  }

  const moveFuture = (direction: -1 | 1) => {
    setFutureOffset((current) => Math.min(Math.max(current + direction, 0), maxFutureOffset))
  }

  const handleCarouselWheel =
    (move: (direction: -1 | 1) => void) => (event: WheelEvent<HTMLDivElement>) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      if (delta === 0) return

      event.preventDefault()
      move(delta > 0 ? 1 : -1)
    }

  const handleLogoutClick = () => {
    onLogout()
    navigate('/')
  }

  const statsCards = currentUser?.role === 'Player'
    ? [
        {
          value: formatStatValue(currentUser.stats.participations),
          label: 'Matches Played',
        },
        {
          value: formatStatValue(currentUser.stats.championshipsWon),
          label: 'Tournament Wins',
        },
        {
          value: formatStatValue(currentUser.stats.totalScore, 'pt'),
          label: 'Current Points',
        },
        {
          value: formatCurrencyValue(currentUser.stats.feesPaid),
          label: 'Fees Paid',
        },
      ]
    : [
        { value: 'N/A', label: 'Matches Played' },
        { value: 'N/A', label: 'Tournament Wins' },
        { value: 'N/A', label: 'Current Points' },
        { value: 'N/A', label: 'Fees Paid' },
      ]

  const showPlayerStats = currentUser?.role === 'Player'

  return (
  <div className="min-h-screen bg-[#b8cfb8]" style={{ fontFamily: 'system-ui, sans-serif' }}>

    {/* ── Header ── */}
    <header className="bg-white shadow-sm px-8 py-3 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <img
          src="https://placehold.co/44x44/2d5a27/ffffff?text=P"
          alt="Pickleball Online logo"
          className="w-11 h-11 rounded-full"
        />
        <span className="text-2xl font-bold text-[#1a3a1a]">Pickleball Online</span>
      </div>

      {/* Bell + Profile */}
      <div className="flex items-center gap-5">
        <BellIcon className="w-6 h-6 text-gray-500 cursor-pointer hover:text-gray-800 transition-colors" />
        {currentUser ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8aaa80] text-sm font-bold text-white">
                {getInitials(currentUser.name ?? currentUser.email)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800">
                  {currentUser.name ?? currentUser.email}
                </span>
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="text-left text-xs font-semibold tracking-wide text-[#1a3a1a] transition hover:text-[#2d5a27]"
                >
                  LOG OUT
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Link
            to="/auth/login"
            className="rounded-full bg-[#1a3a1a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2d5a27]"
          >
            LOGIN / SIGN UP
          </Link>
        )}
      </div>
    </header>

    {/* ── Page body ── */}
    <div className="flex gap-6 px-8 py-6">

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 flex flex-col gap-7">

        {/* Search + Filter bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or organizer..."
              className="w-full pl-11 pr-4 py-2.5 rounded-full border border-white/80 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <button className="flex items-center gap-2 bg-[#1a3a1a] text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm hover:bg-[#2d5a27] transition-colors cursor-pointer shrink-0">
            <FilterIcon className="w-4 h-4" />
            FILTER
          </button>
        </div>

        {/* Starting Soon */}
        {startingSoon.length ? (
          <TournamentCarousel
            title="Starting Soon"
            tournaments={startingSoon}
            offset={startingSoonOffset}
            onMoveLeft={() => moveStartingSoon(-1)}
            onMoveRight={() => moveStartingSoon(1)}
            onWheel={handleCarouselWheel(moveStartingSoon)}
            showEndMessage
            requiresLogin={!currentUser}
          />
        ) : (
          <section>
            <h2 className="text-2xl font-bold text-[#1a3a1a] mb-4">Starting Soon</h2>
            <div className="flex min-h-72 items-center justify-center rounded-2xl bg-white/55 text-[#1a3a1a] shadow-sm">
              {tournamentsError ?? 'Loading tournaments...'}
            </div>
          </section>
        )}

        {/* Future Tournaments */}
        {futureTournaments.length ? (
          <TournamentCarousel
            title="Future Tournaments"
            tournaments={futureTournaments}
            offset={futureOffset}
            onMoveLeft={() => moveFuture(-1)}
            onMoveRight={() => moveFuture(1)}
            onWheel={handleCarouselWheel(moveFuture)}
            requiresLogin={!currentUser}
          />
        ) : (
          <section>
            <h2 className="text-2xl font-bold text-[#1a3a1a] mb-4">Future Tournaments</h2>
            <div className="flex min-h-72 items-center justify-center rounded-2xl bg-white/55 text-[#1a3a1a] shadow-sm">
              {tournamentsError ?? 'Loading tournaments...'}
            </div>
          </section>
        )}
      </main>

      {/* ── Sidebar ── */}
      <aside className="w-72 shrink-0 flex flex-col gap-4 self-stretch">

        {/* Your Stats */}
        {showPlayerStats ? (
          <div className="bg-[#1a3a1a] text-white rounded-2xl p-5 shadow-md">
            <h2 className="font-bold text-lg text-center mb-1">Your Stats</h2>
            <p className="text-green-300 text-sm text-center mb-2">
              Skill Level: {currentUser.stats.skillLevel}
            </p>
            <p className="text-white/70 text-xs text-center mb-3">
              {getAccountStatusText(currentUser.accountStatus)}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {statsCards.map(({ value, label }) => (
                <div key={label} className="bg-[#2d5a27] rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-xs text-green-300 mt-1 leading-tight">{label}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Leaderboard */}
        <div className="bg-[#1a3a1a] text-white rounded-2xl p-5 shadow-md flex flex-col">
          <h2 className="font-bold text-lg text-center mb-4">Leaderboard</h2>
          <div className="flex flex-col gap-2">
            {leaderboard.map(({ playerId, position, name, totalScore, winRate }, i) => (
              <div key={playerId} className="flex items-center gap-3 bg-[#2d5a27] rounded-xl px-4 py-3">
                <img
                  src={`https://placehold.co/48x48/${getAvatarBg(playerId)}/ffffff?text=${name.split(' ').map(w => w[0]).join('')}`}
                  alt={name}
                  className="w-12 h-12 rounded-full shrink-0 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[15px] leading-tight text-white break-words">{name}</p>
                  <p className="text-white/60 text-sm mt-1 leading-none">Win rate:</p>
                  <p className="text-white/70 text-sm mt-1 leading-none">{winRate.toFixed(2)}%</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                  <span className={`rounded-lg px-2.5 py-1 text-[13px] font-bold leading-none ${
                    i === 0 ? 'bg-[#f2c94c] text-[#244420]' :
                    i === 1 ? 'bg-[#dbe2ea] text-[#244420]' :
                    i === 2 ? 'bg-[#d9994d] text-[#244420]' :
                    'bg-white/12 text-white/70'
                  }`}>
                    {getOrdinal(position)}
                  </span>
                  <p className="text-[18px] font-bold leading-none tabular-nums text-white">{totalScore}pt</p>
                </div>
              </div>
            ))}
            {!leaderboard.length && (
              <div className="flex items-center justify-center rounded-xl bg-[#2d5a27] px-4 py-6 text-sm text-white/70">
                {leaderboardError ?? 'Loading leaderboard...'}
              </div>
            )}
          </div>
        </div>

      </aside>
    </div>

    {/* ── Floating Help button — expands left on hover ── */}
    <button className="fixed bottom-6 right-6 flex items-center bg-[#4a9a4a] text-white rounded-full shadow-lg hover:bg-[#5aaa5a] transition-all duration-300 cursor-pointer group overflow-hidden h-11">
      {/* "Help" text slides out from the left */}
      <span className="max-w-0 group-hover:max-w-[60px] overflow-hidden whitespace-nowrap transition-all duration-300 text-sm font-semibold pl-0 group-hover:pl-4">
        Help
      </span>
      {/* ? cap — always visible */}
      <span className="w-11 h-11 flex items-center justify-center text-lg font-bold shrink-0">
        ?
      </span>
    </button>

  </div>
)
}

export default Dashboard
