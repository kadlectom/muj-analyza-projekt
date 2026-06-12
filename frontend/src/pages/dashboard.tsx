import { useEffect, useState } from 'react';

interface Challenge {
  id: string;
  name: string;
  status: string;
  type: string;
  startDate: string;
  endDate: string;
  participants: number;
  leaderboard: { name: string; points: number }[];
}

export default function Dashboard() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    fetch('/api/challenges')
      .then((res) => res.json())
      .then(setChallenges)
      .catch(() => setChallenges([]));
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: 'Arial, sans-serif', maxWidth: 1100, margin: '0 auto' }}>
      <h1>Firemní sportovní výzvy</h1>
      <p>Tento starter odráží požadavky z PRD: přehled výzev, stav, leaderboard a archivní výzvy.</p>
      <section style={{ display: 'grid', gap: 16 }}>
        {challenges.map((challenge) => (
          <article key={challenge.id} style={{ border: '1px solid #d0d7de', borderRadius: 14, padding: 16, background: '#fff' }}>
            <h2 style={{ marginTop: 0 }}>{challenge.name}</h2>
            <p><strong>Typ:</strong> {challenge.type} &nbsp;|&nbsp; <strong>Stav:</strong> {challenge.status}</p>
            <p><strong>Trvání:</strong> {challenge.startDate} – {challenge.endDate}</p>
            <p><strong>Účastníci:</strong> {challenge.participants}</p>
            <h3>Leaderboard</h3>
            <ol>
              {challenge.leaderboard.map((entry) => (
                <li key={`${challenge.id}-${entry.name}`}>{entry.name} — {entry.points} bodů</li>
              ))}
            </ol>
          </article>
        ))}
      </section>
    </main>
  );
}
