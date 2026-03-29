import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`Server running on port ${process.env.PORT || 3001}`);
});