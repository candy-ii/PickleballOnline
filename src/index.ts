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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
