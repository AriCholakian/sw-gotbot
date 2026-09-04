// src/server/bot/BaseBot.ts
import EntireGame from "../../common/EntireGame";
import User from "../User";
import BotController from "./BotController";

export default abstract class BaseBot implements BotController {
    act(entireGame: EntireGame, botUser: User): boolean {
        const stateName = entireGame.leafState.constructor.name;

        switch (stateName) {
            case "LobbyGameState":
                entireGame.onClientMessage(botUser, { type: "ready" });
                return true;

            case "PlaceOrdersGameState":
                return this.placeOrders(entireGame, botUser);

            case "ReplaceOrderGameState":
                entireGame.onClientMessage(botUser, { type: "skip-replace-order" });
                return true;

            case "ResolveSingleMarchOrderGameState":
                return this.resolveSingleMarchOrder(entireGame, botUser);

            case "ChooseHouseCardGameState":
                return this.chooseHouseCard(entireGame, botUser);

            case "SimpleChoiceGameState":
                return this.simpleChoice(entireGame, botUser);

            case "SelectHouseCardGameState":
                return this.selectHouseCard(entireGame, botUser);

            case "PlayerMusteringGameState":
                return this.playerMustering(entireGame, botUser);

            case "BiddingGameState":
                return this.bid(entireGame, botUser);

            case "ResolveTiesGameState":
                return this.resolveTies(entireGame, botUser);

            case "SelectUnitsGameState":
                return this.selectUnits(entireGame, botUser);

            case "SelectRegionGameState":
                return this.selectRegion(entireGame, botUser);

            case "UseValyrianSteelBladeGameState":
                return this.useValyrianSteelBlade(entireGame, botUser);

            case "DeclareSupportGameState":
                return this.declareSupport(entireGame, botUser);

            case "SelectOrdersGameState":
                return this.selectOrders(entireGame, botUser);

            case "PlayerReconcileArmiesGameState":
                return this.reconcileArmies(entireGame, botUser);

            case "ResolveSingleRaidOrderGameState":
                return this.resolveSingleRaidOrder(entireGame, botUser);

            case "ResolveSingleConsolidatePowerGameState":
                return this.resolveSingleConsolidatePower(entireGame, botUser);

            default:
                console.warn(
                    `${this.constructor.name}: no handler for leaf state "${stateName}" (user ${botUser.name})`
                );
                return false;
        }
    }

    protected abstract placeOrders(entireGame: EntireGame, botUser: User): boolean;
    protected abstract resolveSingleMarchOrder(entireGame: EntireGame, botUser: User): boolean;
    protected abstract chooseHouseCard(entireGame: EntireGame, botUser: User): boolean;
    protected abstract simpleChoice(entireGame: EntireGame, botUser: User): boolean;
    protected abstract selectHouseCard(entireGame: EntireGame, botUser: User): boolean;
    protected abstract playerMustering(entireGame: EntireGame, botUser: User): boolean;
    protected abstract bid(entireGame: EntireGame, botUser: User): boolean;
    protected abstract resolveTies(entireGame: EntireGame, botUser: User): boolean;
    protected abstract selectUnits(entireGame: EntireGame, botUser: User): boolean;
    protected abstract selectRegion(entireGame: EntireGame, botUser: User): boolean;
    protected abstract useValyrianSteelBlade(entireGame: EntireGame, botUser: User): boolean;
    protected abstract declareSupport(entireGame: EntireGame, botUser: User): boolean;
    protected abstract selectOrders(entireGame: EntireGame, botUser: User): boolean;
    protected abstract reconcileArmies(entireGame: EntireGame, botUser: User): boolean;
    protected abstract resolveSingleRaidOrder(entireGame: EntireGame, botUser: User): boolean;
    protected abstract resolveSingleConsolidatePower(entireGame: EntireGame, botUser: User): boolean;
}