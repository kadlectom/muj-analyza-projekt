import express from 'express';

const app = express();
app.use(express.json());

const challenges = [
  {
    id: 'summer-2026',
    name: 'Letní výzva 2026',
    status: 'Active',
    type: 'Letní',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    participants: 42,
    leaderboard: [
      { name: 'Petr', points: 1840 },
      { name: 'Eva', points: 1760 },
      { name: 'Lukáš', points: 1685 }
    ]
  },
  {
    id: 'winter-2025',
    name: 'Zimní výzva 2025',
    status: 'Archived',
    type: 'Zimní',
    startDate: '2025-12-01',
    endDate: '2026-02-28',
    participants: 38,
    leaderboard: [
      { name: 'Honza', points: 2210 },
      { name: 'Michaela', points: 2140 },
      { name: 'Tereza', points: 2085 }
    ]
  }
];

app.get('/api/challenges', (_req, res) => {
  res.json(challenges);
});

app.get('/api/challenges/:id', (req, res) => {
  const challenge = challenges.find((item) => item.id === req.params.id);
  if (!challenge) {
    res.status(404).json({ message: 'Challenge not found' });
    return;
  }

  res.json(challenge);
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sport-challenge-backend' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Backend listening on ${port}`));
