import { runHeadlessGame } from "./runHeadlessGame";

const N = 10;
let completed = 0;
console.time(`${N} games`);
for (let i = 0; i < N; i++) {
  const g = runHeadlessGame();
  if (g.ingameGameState?.isEndedOrCancelled) completed++;
  else console.warn(`Game ${i} did not finish - turn ${g.ingameGameState?.game.turn}, state: ${g.leafState.constructor.name}`);
}
console.timeEnd(`${N} games`);
console.log(`${completed}/${N} completed`);