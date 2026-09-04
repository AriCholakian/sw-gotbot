// src/server/bot/seatBots.ts
import EntireGame from "../../common/EntireGame";
import BotManager from "./BotManager";
import { createBotUser } from "./BotUser";

export type BotClass = new () => Parameters<BotManager["register"]>[1];

function shuffle<T>(items: T[]): T[] {
  const shuffled = items.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function seatBots(
  entireGame: EntireGame,
  manager: BotManager,
  botClasses: BotClass[]
): void {
  const lobby = entireGame.lobbyGameState;
  if (!lobby) throw new Error("seatBots called outside the lobby");

  const openHouses = lobby
    .getAvailableHouses()
    .filter((h) => !lobby.players.has(h));

  const seatedHouses = shuffle(openHouses).slice(0, botClasses.length);

  seatedHouses.forEach((house, i) => {
    const BotClass = botClasses[i];
    const bot = createBotUser(entireGame, `bot-${house.id}`, `Bot ${i + 1} (${house.name})`);
    manager.register(bot, new BotClass());
    entireGame.onClientMessage(bot, {
      type: "choose-house",
      house: house.id,
      password: ""
    });
  });
}