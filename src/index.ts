import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const { rows } = await pool.query<{
      player_id: number;
      name: string;
      total_score: number | null;
      championships_won: number | null;
      win_rate: string | number;
    }>(`
      SELECT
        player_id,
        name,
        total_score,
        championships_won,
        CASE
          WHEN COALESCE(total_score, 0) <= 0 THEN 0
          ELSE ROUND((COALESCE(championships_won, 0)::numeric / total_score::numeric) * 100, 2)
        END AS win_rate
      FROM public.player_details
      WHERE account_status = 'Active'
      ORDER BY total_score DESC, championships_won DESC, name ASC
      LIMIT 5
    `);

    res.json(
      rows.map((row, index) => ({
        playerId: row.player_id,
        position: index + 1,
        name: row.name,
        totalScore: row.total_score ?? 0,
        championshipsWon: row.championships_won ?? 0,
        winRate: Number(row.win_rate),
      })),
    );
  } catch (error) {
    console.error('Failed to load leaderboard:', error);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

app.get('/api/tournaments', async (req, res) => {
  try {
    const { rows } = await pool.query<{
      tournament_id: number;
      title: string;
      date: Date | string;
      skill_cap: number | null;
      status: string | null;
      organizer_fee: string | number | null;
      organizer_name: string | null;
    }>(`
      SELECT
        t.tournament_id,
        t.title,
        t.date,
        t.skill_cap,
        t.status,
        t.organizer_fee,
        o.name AS organizer_name
      FROM public.tournament t
      LEFT JOIN public.organizer_details o ON o.org_id = t.org_id
      WHERE t.date >= NOW()
    `);

    const tournaments = rows.map((row) => {
      return {
        tournamentId: row.tournament_id,
        title: row.title,
        date: new Date(row.date),
        skillCap: row.skill_cap ?? 0,
        organizerFee: Number(row.organizer_fee ?? 0),
        organizer: row.organizer_name ?? 'Unknown Organizer',
        spotsLeft: Math.max(Number(row.status ?? 0), 0),
      };
    });

    const startingSoon = [...tournaments]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);

    const futureByOrganizerFee = [...tournaments]
      .sort((a, b) => {
        if (b.organizerFee !== a.organizerFee) {
          return b.organizerFee - a.organizerFee;
        }

        return a.date.getTime() - b.date.getTime();
      })
      .slice(0, 5);

    res.json({
      startingSoon,
      futureTournaments: futureByOrganizerFee,
    });
  } catch (error) {
    console.error('Failed to load tournaments:', error);
    res.status(500).json({ error: 'Failed to load tournaments' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
