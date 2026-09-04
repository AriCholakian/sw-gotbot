import EntireGame from "../../common/EntireGame";
import User from "../User";
import BotController from "./BotController";

export default class BotManager {
  private bots = new Map<string, BotController>(); // userId -> controller

  register(botUser: User, controller: BotController): void {
    this.bots.set(botUser.id, controller);
  }

  isBot(userId: string): boolean {
    return this.bots.has(userId);
  }

tick(entireGame: EntireGame): void {
    let waiting: User[];
    try {
      waiting = entireGame.leafState.getWaitedUsers();
    } catch {
      return;
    }

    const botUser = waiting.find((u) => this.bots.has(u.id));
    if (!botUser) return; // No bots waiting, we are done.

    // Bot takes an action
    const acted = this.bots.get(botUser.id)!.act(entireGame, botUser);
    
    // If the bot acted successfully, wait for the current Node.js execution frame 
    // to finish (allowing the game engine to update the state), then tick again.
    if (acted) {
      setTimeout(() => {
        this.tick(entireGame);
      }, 0); 
    }
  }
}