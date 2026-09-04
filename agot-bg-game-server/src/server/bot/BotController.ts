import EntireGame from "../../common/EntireGame";
import User from "../User";

// Returns true if the bot sent a message this tick, false if it doesn't
// know how to act on the current leaf state (BotManager stops instead of spinning).
export default interface BotController {
  act(entireGame: EntireGame, botUser: User): boolean;
}