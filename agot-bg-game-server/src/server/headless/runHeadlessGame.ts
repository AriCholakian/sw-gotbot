// src/server/headless/runHeadlessGame.ts
import { v4 } from "uuid";
import EntireGame from "../../common/EntireGame";
import BotManager from "../bot/BotManager";
import SimpleBot from "../bot/SimpleBot";
import { createBotUser } from "../bot/BotUser";
import { seatBots, BotClass } from "../bot/seatBots";

export interface RunHeadlessGameOptions {
  bots?: BotClass[];
}

export function runHeadlessGame(options: RunHeadlessGameOptions = {}): EntireGame {
  const bots =
    options.bots ?? [SimpleBot, SimpleBot, SimpleBot, SimpleBot, SimpleBot, SimpleBot];

  const ownerId = "owner-proxy";
  const entireGame = new EntireGame(v4(), ownerId, "Headless Self-Play");
  entireGame.publicChatRoomId = "unused";
  entireGame.gameSettings.pbem = true;
  entireGame.gameSettings.onlyLive = false;
  entireGame.gameSettings.playerCount = 6;
  entireGame.gameSettings.setupId = "base-game";

  entireGame.firstStart();

  const owner = createBotUser(entireGame, ownerId, "Owner");
  const manager = new BotManager();

  seatBots(entireGame, manager, bots);

  entireGame.onClientMessage(owner, { type: "launch-game" });
  manager.tick(entireGame);

  let guard = 0;
  while (!entireGame.ingameGameState?.isEndedOrCancelled && guard++ < 20000) {
    manager.tick(entireGame);
  }

  return entireGame;
}