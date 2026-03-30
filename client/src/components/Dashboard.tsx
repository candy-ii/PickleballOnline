import { useEffect, useState, type FC } from 'react'

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
}

interface LeaderboardPlayer {
  playerId: number
  position: number
  name: string
  totalScore: number
  championshipsWon: number
  winRate: number
}

const startingSoon: Tournament[] = [
  { id: 1, name: 'Tournament Alpha', spotsLeft: 3, startLabel: 'IN 2 DAYS',   organizer: 'Team Pro',         canJoin: true,  imageBg: '3a6b35' },
  { id: 2, name: 'Tourney Beta',     spotsLeft: 1, startLabel: 'TODAY',        organizer: 'Local Pball Club', canJoin: true,  imageBg: '2d5a27' },
  { id: 3, name: 'Tourney Gamma',    spotsLeft: 1, startLabel: 'TOMORROW',     organizer: 'Apex Sports',      canJoin: true,  imageBg: '4a7a40' },
]

const futureTournaments: Tournament[] = [
  { id: 4, name: 'Tournament Delta',   spotsLeft: 0, startLabel: 'IN 5 DAYS',  organizer: 'Team Pro',    canJoin: false, imageBg: '2a4a25' },
  { id: 5, name: 'Tourney Epsilon',    spotsLeft: 0, startLabel: 'IN 1 MONTH', organizer: 'Pbam Pro',    canJoin: false, imageBg: '1e3a1a' },
  { id: 6, name: 'Tournament Zeta',    spotsLeft: 5, startLabel: 'IN 1 WEEK',  organizer: 'City League', canJoin: true,  imageBg: '3d6b38' },
]

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const avatarPalette = ['5a8a5a', '4a7a6a', '6a9a7a', '3a6a5a', '4a6a4a', '6a8f54']

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

// ── Tournament Card ───────────────────────────────────────────────────────────

const TournamentCard: FC<{ t: Tournament }> = ({ t }) => (
  <div className="bg-white rounded-2xl shadow-md flex flex-col transition-all duration-200 hover:scale-[1.03] hover:shadow-xl cursor-pointer">
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
          <button className="w-full bg-[#1a3a1a] text-white rounded-full py-2 text-sm font-bold hover:bg-[#2d5a27] transition-colors cursor-pointer">
            Join Now
          </button>
        ) : (
          <button className="w-full bg-[#7a8a6a] text-white rounded-full py-2 text-sm font-bold hover:bg-[#8a9a7a] transition-colors cursor-pointer">
            WAITLIST
          </button>
        )}
      </div>
    </div>
  </div>
)

// ── Dashboard ─────────────────────────────────────────────────────────────────

const Dashboard: FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([])
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadLeaderboard = async () => {
      try {
        setLeaderboardError(null)

        const response = await fetch(`${API_BASE_URL}/api/leaderboard`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Leaderboard request failed with ${response.status}`)
        }

        const data = (await response.json()) as LeaderboardPlayer[]
        setLeaderboard(data)
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.error('Failed to fetch leaderboard:', error)
        setLeaderboardError('Unable to load leaderboard')
      }
    }

    void loadLeaderboard()

    return () => controller.abort()
  }, [])

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
        <div className="flex items-center gap-2">
          <img
            src="https://placehold.co/40x40/8aaa80/ffffff?text=JP"
            alt="Johnny Pickleball avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className="text-sm font-semibold text-gray-800">Johnny Pickleball</span>
        </div>
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
        <section>
          <h2 className="text-2xl font-bold text-[#1a3a1a] mb-4">Starting Soon</h2>
          <div className="grid grid-cols-3 gap-5">
            {startingSoon.map(t => <TournamentCard key={t.id} t={t} />)}
          </div>
        </section>

        {/* Future Tournaments */}
        <section>
          <h2 className="text-2xl font-bold text-[#1a3a1a] mb-4">Future Tournaments</h2>
          <div className="grid grid-cols-3 gap-5">
            {futureTournaments.map(t => <TournamentCard key={t.id} t={t} />)}
          </div>
        </section>
      </main>

      {/* ── Sidebar ── */}
      <aside className="w-72 shrink-0 flex flex-col gap-4 self-stretch">

        {/* Your Stats */}
        <div className="bg-[#1a3a1a] text-white rounded-2xl p-5 shadow-md">
          <h2 className="font-bold text-lg text-center mb-1">Your Stats</h2>
          <p className="text-green-300 text-sm text-center mb-4">Skill Level: Intermediate</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: '30',   label: 'Matches Played'   },
              { value: '2',    label: 'Tournament Wins'  },
              { value: '15pt', label: 'Current Points'   },
              { value: '65%',  label: 'Win/Loss Ratio'   },
            ].map(({ value, label }) => (
              <div key={label} className="bg-[#2d5a27] rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-green-300 mt-1 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-[#1a3a1a] text-white rounded-2xl p-5 shadow-md flex-1 flex flex-col">
          <h2 className="font-bold text-lg text-center mb-4">Leaderboard</h2>
          <div className="flex flex-col gap-2 flex-1 justify-between">
            {leaderboard.map(({ playerId, position, name, totalScore, winRate }, i) => (
              <div key={playerId} className="flex items-center gap-3 bg-[#2d5a27] rounded-xl px-4 py-3 flex-1">
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
              <div className="flex flex-1 items-center justify-center rounded-xl bg-[#2d5a27] px-4 py-6 text-sm text-white/70">
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
