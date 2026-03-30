export interface AuthUser {
  userId: number
  email: string
  role: string
  playerId: number | null
  name: string | null
  age: number | null
  accountStatus: string | null
  stats: {
    totalScore: number
    participations: number
    feesPaid: number
    championshipsWon: number
    skillLevel: string
  }
}
