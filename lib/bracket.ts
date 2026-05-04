export interface BracketMatchup {
  itemAId: string;
  itemBId: string;
  winnerId: string | null;
}

export interface BracketRound {
  round: number;
  matchups: BracketMatchup[];
}

export interface BracketState {
  rounds: BracketRound[];
  currentRound: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateBracket(itemIds: string[]): BracketState {
  if (itemIds.length !== 8) throw new Error("Bracket requires exactly 8 items");

  const seeded = shuffle(itemIds);
  const round1: BracketMatchup[] = [
    { itemAId: seeded[0], itemBId: seeded[1], winnerId: null },
    { itemAId: seeded[2], itemBId: seeded[3], winnerId: null },
    { itemAId: seeded[4], itemBId: seeded[5], winnerId: null },
    { itemAId: seeded[6], itemBId: seeded[7], winnerId: null },
  ];

  const round2: BracketMatchup[] = [
    { itemAId: "", itemBId: "", winnerId: null },
    { itemAId: "", itemBId: "", winnerId: null },
  ];

  const round3: BracketMatchup[] = [
    { itemAId: "", itemBId: "", winnerId: null },
  ];

  return {
    rounds: [
      { round: 1, matchups: round1 },
      { round: 2, matchups: round2 },
      { round: 3, matchups: round3 },
    ],
    currentRound: 1,
  };
}

export function getCurrentMatchup(state: BracketState): BracketMatchup | null {
  const round = state.rounds.find((r) => r.round === state.currentRound);
  if (!round) return null;
  return round.matchups.find((m) => m.winnerId === null) ?? null;
}

export function getRoundProgress(state: BracketState): { done: number; total: number } {
  const total = state.rounds.reduce((s, r) => s + r.matchups.length, 0);
  const done = state.rounds.reduce(
    (s, r) => s + r.matchups.filter((m) => m.winnerId !== null).length,
    0
  );
  return { done, total };
}

export function applyVote(state: BracketState, winnerId: string, loserId: string): BracketState {
  const next: BracketState = JSON.parse(JSON.stringify(state));
  const round = next.rounds.find((r) => r.round === next.currentRound)!;
  const matchup = round.matchups.find(
    (m) =>
      m.winnerId === null &&
      ((m.itemAId === winnerId && m.itemBId === loserId) ||
        (m.itemAId === loserId && m.itemBId === winnerId))
  );

  if (!matchup) return next;
  matchup.winnerId = winnerId;

  const allDone = round.matchups.every((m) => m.winnerId !== null);
  if (allDone && next.currentRound < 3) {
    const winners = round.matchups.map((m) => m.winnerId!);
    const nextRound = next.rounds.find((r) => r.round === next.currentRound + 1)!;
    for (let i = 0; i < nextRound.matchups.length; i++) {
      nextRound.matchups[i].itemAId = winners[i * 2];
      nextRound.matchups[i].itemBId = winners[i * 2 + 1];
    }
    next.currentRound += 1;
  }

  return next;
}

export function isBracketComplete(state: BracketState): boolean {
  return state.rounds.every((r) => r.matchups.every((m) => m.winnerId !== null));
}

export function getBracketWinner(state: BracketState): string | null {
  const final = state.rounds.find((r) => r.round === 3);
  return final?.matchups[0]?.winnerId ?? null;
}
