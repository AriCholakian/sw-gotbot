import { BotClass } from "../server/bot/seatBots"; // adjust path to match your structure
import SimpleBot from "../server/bot/SimpleBot";
//import SmartBot from "../server/bot/SmartBot";

export const botLineups: Record<string, BotClass[]> = {
  allsimple: [SimpleBot, SimpleBot, SimpleBot, SimpleBot, SimpleBot, SimpleBot],
};

export function getBotLineup(name: string = "allsimple"): BotClass[] {
  const lineup = botLineups[name];
  if (!lineup) {
    throw new Error(
      `Unknown bot lineup "${name}". Available: ${Object.keys(botLineups).join(", ")}`
    );
  }
  return lineup;
}