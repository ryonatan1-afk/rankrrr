const K = 32;

function expected(rA: number, rB: number) {
  return 1 / (1 + Math.pow(10, (rB - rA) / 400));
}

interface VoteRow {
  winnerId: string;
  itemAId: string;
  itemBId: string;
}

export interface ItemScore {
  itemId: string;
  elo: number;
  wins: number;
  losses: number;
  eloHistory: number[];
}

export function computeElo(votes: VoteRow[]): Map<string, ItemScore> {
  const scores = new Map<string, ItemScore>();

  function getOrInit(id: string): ItemScore {
    if (!scores.has(id)) scores.set(id, { itemId: id, elo: 1200, wins: 0, losses: 0, eloHistory: [1200] });
    return scores.get(id)!;
  }

  for (const vote of votes) {
    const loserId = vote.winnerId === vote.itemAId ? vote.itemBId : vote.itemAId;
    const winner = getOrInit(vote.winnerId);
    const loser = getOrInit(loserId);

    const eW = expected(winner.elo, loser.elo);
    const eL = expected(loser.elo, winner.elo);

    winner.elo = winner.elo + K * (1 - eW);
    loser.elo = loser.elo + K * (0 - eL);

    winner.wins += 1;
    loser.losses += 1;

    winner.eloHistory = [...winner.eloHistory, winner.elo].slice(-12);
    loser.eloHistory = [...loser.eloHistory, loser.elo].slice(-12);
  }

  return scores;
}
