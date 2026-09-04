import User, { UserSettings } from "../User";
import EntireGame from "../../common/EntireGame";

export function createBotUser(
  entireGame: EntireGame,
  id: string,
  name: string
): User {
  const botUser = new User(id, name, name, entireGame, new UserSettings());
  entireGame.users.set(botUser.id, botUser);
  return botUser;
}