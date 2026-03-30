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

type PlayerProfileRow = {
  user_id: number;
  email: string;
  role: string;
  player_id: number | null;
  name: string | null;
  age: number | null;
  total_score: number | null;
  participations: number | null;
  fees_paid: string | number | null;
  account_status: string | null;
  championships_won: number | null;
};

const getSkillLevel = (participations: number) => {
  if (participations >= 20) return 'Expert';
  if (participations >= 11) return 'Advanced';
  if (participations >= 6) return 'Intermediate';
  return 'Beginner';
};

const formatUserProfile = (row: PlayerProfileRow) => {
  const participations = row.participations ?? 0;

  return {
    userId: row.user_id,
    email: row.email,
    role: row.role,
    playerId: row.player_id,
    name: row.name,
    age: row.age,
    accountStatus: row.account_status,
    stats: {
      totalScore: row.total_score ?? 0,
      participations,
      feesPaid: Number(row.fees_paid ?? 0),
      championshipsWon: row.championships_won ?? 0,
      skillLevel: getSkillLevel(participations),
    },
  };
};

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.get('/api/auth/me/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({ error: 'Invalid user id' });
      return;
    }

    const { rows } = await pool.query<PlayerProfileRow>(`
      SELECT
        u.user_id,
        u.email,
        u.role,
        p.player_id,
        p.name,
        p.age,
        p.total_score,
        p.participations,
        p.fees_paid,
        p.account_status,
        p.championships_won
      FROM public.users u
      LEFT JOIN public.player_details p ON p.user_id = u.user_id
      WHERE u.user_id = $1
      LIMIT 1
    `, [userId]);

    const user = rows[0];

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(formatUserProfile(user));
  } catch (error) {
    console.error('Failed to load current user:', error);
    res.status(500).json({ error: 'Failed to load current user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const { rows } = await pool.query<PlayerProfileRow>(`
      SELECT
        u.user_id,
        u.email,
        u.role,
        p.player_id,
        p.name,
        p.age,
        p.total_score,
        p.participations,
        p.fees_paid,
        p.account_status,
        p.championships_won
      FROM public.users u
      LEFT JOIN public.player_details p ON p.user_id = u.user_id
      WHERE LOWER(u.email) = LOWER($1) AND u.password = $2
      LIMIT 1
    `, [email.trim(), password]);

    const user = rows[0];

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    res.json(formatUserProfile(user));
  } catch (error) {
    console.error('Failed to log in:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

app.post('/api/auth/signup/player', async (req, res) => {
  const client = await pool.connect();

  try {
    const { email, password, name, age } = req.body as {
      email?: string;
      password?: string;
      name?: string;
      age?: number | string;
    };

    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedName = name?.trim();
    const parsedAge = Number(age);

    if (!normalizedEmail || !password || !normalizedName || !Number.isInteger(parsedAge) || parsedAge <= 0) {
      res.status(400).json({ error: 'Email, password, name, and age are required' });
      return;
    }

    await client.query('BEGIN');

    const existing = await client.query<{ user_id: number }>(
      `SELECT user_id FROM public.users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [normalizedEmail],
    );

    if (existing.rowCount) {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'An account with that email already exists' });
      return;
    }

    const userInsert = await client.query<{ user_id: number }>(`
      INSERT INTO public.users (email, password, role)
      VALUES ($1, $2, 'Player')
      RETURNING user_id
    `, [normalizedEmail, password]);

    const userId = userInsert.rows[0]?.user_id;

    if (!userId) {
      throw new Error('User creation failed');
    }

    await client.query(`
      INSERT INTO public.player_details (
        user_id,
        name,
        age,
        total_score,
        participations,
        fees_paid,
        account_status,
        championships_won
      )
      VALUES ($1, $2, $3, 0, 0, 0, 'Inactive', 0)
    `, [userId, normalizedName, parsedAge]);

    const profile = await client.query<PlayerProfileRow>(`
      SELECT
        u.user_id,
        u.email,
        u.role,
        p.player_id,
        p.name,
        p.age,
        p.total_score,
        p.participations,
        p.fees_paid,
        p.account_status,
        p.championships_won
      FROM public.users u
      LEFT JOIN public.player_details p ON p.user_id = u.user_id
      WHERE u.user_id = $1
      LIMIT 1
    `, [userId]);

    const createdProfile = profile.rows[0];

    if (!createdProfile) {
      throw new Error('Profile creation failed');
    }

    await client.query('COMMIT');

    res.status(201).json(formatUserProfile(createdProfile));
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to sign up player:', error);
    res.status(500).json({ error: 'Failed to sign up player' });
  } finally {
    client.release();
  }
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
