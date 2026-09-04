// src/server/bot/SimpleBot.ts
import EntireGame from "../../common/EntireGame";
import BetterMap from "../../utils/BetterMap";
import User from "../User";
import BaseBot from "./BaseBot";
import PlaceOrdersGameState from "../../common/ingame-game-state/planning-game-state/place-orders-game-state/PlaceOrdersGameState";
import ResolveSingleMarchOrderGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/resolve-single-march-order-game-state/ResolveSingleMarchOrderGameState";
import ChooseHouseCardGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/choose-house-card-game-state/ChooseHouseCardGameState";
import SimpleChoiceGameState from "../../common/ingame-game-state/simple-choice-game-state/SimpleChoiceGameState";
import SelectHouseCardGameState from "../../common/ingame-game-state/select-house-card-game-state/SelectHouseCardGameState";
import PlayerMusteringGameState from "../../common/ingame-game-state/westeros-game-state/mustering-game-state/player-mustering-game-state/PlayerMusteringGameState";
import BiddingGameState from "../../common/ingame-game-state/westeros-game-state/bidding-game-state/BiddingGameState";
import ResolveTiesGameState from "../../common/ingame-game-state/westeros-game-state/clash-of-kings-game-state/resolve-ties-game-state/ResolveTiesGameState";
import SelectUnitsGameState from "../../common/ingame-game-state/select-units-game-state/SelectUnitsGameState";
import SelectRegionGameState from "../../common/ingame-game-state/select-region-game-state/SelectRegionGameState";
import UseValyrianSteelBladeGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/use-valyrian-steel-blade-game-state/UseValyrianSteelBladeGameState";
import DeclareSupportGameState from "../../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/declare-support-game-state/DeclareSupportGameState";
import SelectOrdersGameState from "../../common/ingame-game-state/select-orders-game-state/SelectOrdersGameState";
import PlayerReconcileArmiesGameState from "../../common/ingame-game-state/westeros-game-state/reconcile-armies-game-state/player-reconcile-armies-game-state/PlayerReconcileArmiesGameState";
import Region from "../../common/ingame-game-state/game-data-structure/Region";
import Unit from "../../common/ingame-game-state/game-data-structure/Unit";
import ResolveSingleRaidOrderGameState from "../../common/ingame-game-state/action-game-state/resolve-raid-order-game-state/resolve-single-raid-order-game-state/ResolveSingleRaidOrderGameState";
import ResolveSingleConsolidatePowerGameState from "../../common/ingame-game-state/action-game-state/resolve-consolidate-power-game-state/resolve-single-consolidate-power-game-state/ResolveSingleConsolidatePowerGameState";
import ConsolidatePowerOrderType from "../../common/ingame-game-state/game-data-structure/order-types/ConsolidatePowerOrderType";
import DefenseMusterOrderType from "../../common/ingame-game-state/game-data-structure/order-types/DefenseMusterOrderType";
import IronBankOrderType from "../../common/ingame-game-state/game-data-structure/order-types/IronBankOrderType";


export default class SimpleBot extends BaseBot {
    protected placeOrders(entireGame: EntireGame, botUser: User): boolean {
        const ingame = entireGame.ingameGameState;
        if (!ingame) return false;

        const player = ingame.players.get(botUser);
        const state = entireGame.getChildGameState<PlaceOrdersGameState>(PlaceOrdersGameState);

        const emptyRegions = state
            .getPossibleRegionsForOrders(player.house)
            .filter((r) => !state.placedOrders.has(r));

        for (const region of emptyRegions) {
            const legalOrder = state
                .getAvailableOrders(player.house)
                .find(
                    (o) =>
                        !state.game.isOrderRestricted(
                            region,
                            o,
                            state.planningGameState.planningRestrictions,
                            true
                        )
                );

            if (!legalOrder) continue;

            entireGame.onClientMessage(botUser, {
                type: "place-order",
                regionId: region.id,
                orderId: legalOrder.id
            });
        }

        entireGame.onClientMessage(botUser, { type: "ready" });
        return true;
    }

    protected resolveSingleMarchOrder(entireGame: EntireGame, botUser: User): boolean {
        const state = entireGame.getChildGameState<ResolveSingleMarchOrderGameState>(
            ResolveSingleMarchOrderGameState
        );

        const ingame = entireGame.ingameGameState;
        if (!ingame) return false;

        const player = ingame.players.get(botUser);
        if (player.house !== state.house) return false;

        const startingRegions = state.getRegionsWithMarchOrder();

        for (const startingRegion of startingRegions) {
            const validUnits = state.getValidMarchUnits(startingRegion);

            for (const unit of validUnits) {
                const targets = state.getValidTargetRegions(startingRegion, [], [unit]);

                const validTargets = targets.filter(
                    (target) =>
                        target.controlPowerToken !== player.house &&
                        target.superControlPowerToken !== player.house
                );

                if (validTargets.length === 0) continue;

                const target = validTargets[0];
                const leavesRegionEmpty = startingRegion.units.size === 1;

                entireGame.onClientMessage(botUser, {
                    type: "resolve-march-order",
                    startingRegionId: startingRegion.id,
                    moves: [[target.id, [unit.id]]],
                    leavePowerToken: leavesRegionEmpty
                });

                return true;
            }

            entireGame.onClientMessage(botUser, {
                type: "resolve-march-order",
                startingRegionId: startingRegion.id,
                moves: [],
                leavePowerToken: false
            });

            return true;
        }

        return false;
    }

    protected chooseHouseCard(entireGame: EntireGame, botUser: User): boolean {
        const ingame = entireGame.ingameGameState;
        if (!ingame) return false;

        const state = entireGame.getChildGameState<ChooseHouseCardGameState>(ChooseHouseCardGameState);
        const player = ingame.players.get(botUser);

        const commandedHouse = state.combatGameState.getCommandedHouseInCombat(player.house);
        if (!commandedHouse) return false;
        if (state.houseCards.has(commandedHouse)) return false;

        const cards = state.getChoosableCards(commandedHouse);
        if (cards.length === 0) return false;

        const card = cards[0];

        entireGame.onClientMessage(botUser, {
            type: "choose-house-card",
            houseCardId: card.id,
            dontSkipVsbQuestion: false
        });

        return true;
    }

    protected simpleChoice(entireGame: EntireGame, botUser: User): boolean {
        const ingame = entireGame.ingameGameState;
        if (!ingame) return false;

        const state = entireGame.getChildGameState<SimpleChoiceGameState>(SimpleChoiceGameState);
        const player = ingame.players.get(botUser);

        if (ingame.getControllerOfHouse(state.house) !== player) return false;
        if (state.choices.length === 0) return false;

        entireGame.onClientMessage(botUser, { type: "choose-choice", choice: 0 });
        return true;
    }

    protected selectHouseCard(entireGame: EntireGame, botUser: User): boolean {
        const ingame = entireGame.ingameGameState;
        if (!ingame) return false;

        const state = entireGame.getChildGameState<SelectHouseCardGameState<any>>(SelectHouseCardGameState);
        const player = ingame.players.get(botUser);

        if (ingame.getControllerOfHouse(state.house) !== player) return false;
        if (state.houseCards.length === 0) return false;

        entireGame.onClientMessage(botUser, {
            type: "select-house-card",
            houseCard: state.houseCards[0].id
        });

        return true;
    }

    protected playerMustering(entireGame: EntireGame, botUser: User): boolean {
        const ingame = entireGame.ingameGameState;
        if (!ingame) return false;

        const state = entireGame.getChildGameState<PlayerMusteringGameState>(PlayerMusteringGameState);
        const player = ingame.players.get(botUser);

        if (ingame.getControllerOfHouse(state.house) !== player) return false;

        const allowedRegions = state.regions;
        if (allowedRegions.length === 0) {
            entireGame.onClientMessage(botUser, { type: "muster", units: [] });
            return true;
        }

        const isSingleRegionMode = state.type === 1 || state.type === 2 || state.type === 3;

        const musterings = new BetterMap<any, any[]>();
        let regionsToProcess = allowedRegions;

        if (isSingleRegionMode) {
            let chosenRegion = null;
            for (const region of allowedRegions) {
                const testMap = new BetterMap<any, any[]>();
                testMap.set(region, []);

                const validOptions = state.getValidMusteringRules(region, testMap);
                if (validOptions.length > 0) {
                    chosenRegion = region;
                    break;
                }
            }
            regionsToProcess = chosenRegion ? [chosenRegion] : [];
        }

        for (const originatingRegion of regionsToProcess) {
            const currentMusterings: any[] = [];
            musterings.set(originatingRegion, currentMusterings);

            while (true) {
                const validOptionsGrouped = state.getValidMusteringRules(originatingRegion, musterings);

                const allChoices: { targetRegion: any; rule: any }[] = [];
                for (const optionGroup of validOptionsGrouped) {
                    for (const rule of optionGroup.rules) {
                        if (!rule.to.id.toLowerCase().includes("siege")) {
                            allChoices.push({ targetRegion: optionGroup.region, rule });
                        }
                    }
                }

                if (allChoices.length === 0) break;

                allChoices.sort((a, b) => b.rule.cost - a.rule.cost);
                const bestChoice = allChoices[0];

                currentMusterings.push({
                    from: bestChoice.rule.from,
                    to: bestChoice.rule.to,
                    region: bestChoice.targetRegion
                });

                musterings.set(originatingRegion, currentMusterings);
            }
        }

        // FLAGGED: compiler expects `from: number | null`, this sends `m.from.id` (a string).
        // Don't trust this until you've checked the real "muster" ClientMessage type and
        // what getValidMusteringRules' `rule.from` actually represents.
        const unitsPayload: [string, { from: number | null; to: string; region: string }[]][] =
            musterings.entries.map(([origRegion, recs]) => [
                origRegion.id,
                recs.map((m) => ({
                    from: m.from ? m.from.id : null,
                    to: m.to.id,
                    region: m.region.id
                }))
            ]);

        entireGame.onClientMessage(botUser, {
            type: "muster",
            units: unitsPayload
        });

        return true;
    }

    protected bid(entireGame: EntireGame, botUser: User): boolean {
        const ingame = entireGame.ingameGameState;
        if (!ingame) return false;

        const state = entireGame.getChildGameState<BiddingGameState<any>>(BiddingGameState);
        const player = ingame.players.get(botUser);

        if (!state.participatingHouses.includes(player.house)) return false;

        entireGame.onClientMessage(botUser, { type: "bid", powerTokens: 0 });
        return true;
    }

    protected resolveTies(entireGame: EntireGame, botUser: User): boolean {
        const ingame = entireGame.ingameGameState;
        if (!ingame) return false;

        const state = entireGame.getChildGameState<ResolveTiesGameState>(ResolveTiesGameState);
        const player = ingame.players.get(botUser);

        if (ingame.getControllerOfHouse(state.decider) !== player) return false;

        const tiesToResolve = state.getTiesToResolve();
        const resolvedTies = tiesToResolve.map((tie) => tie.houses.map((house) => house.id));

        entireGame.onClientMessage(botUser, { type: "resolve-ties", resolvedTies });
        return true;
    }

    protected selectUnits(entireGame: EntireGame, botUser: User): boolean {
        const ingame = entireGame.ingameGameState;
        if (!ingame) return false;

        const state = entireGame.getChildGameState<SelectUnitsGameState<any>>(SelectUnitsGameState);
        const player = ingame.players.get(botUser);

        if (ingame.getControllerOfHouse(state.house) !== player) return false;

        const targetCount = Math.min(state.count, state.possibleUnits.length);
        const chosenUnits = state.possibleUnits.slice(0, targetCount);

        const unitsByRegion = new Map<string, number[]>();
        for (const unit of chosenUnits) {
            const regionId = unit.region.id;
            if (!unitsByRegion.has(regionId)) unitsByRegion.set(regionId, []);
            unitsByRegion.get(regionId)!.push(unit.id);
        }

        entireGame.onClientMessage(botUser, {
            type: "select-units",
            units: Array.from(unitsByRegion.entries())
        });

        return true;
    }

    protected selectRegion(entireGame: EntireGame, botUser: User): boolean {
        const ingame = entireGame.ingameGameState;
        if (!ingame) return false;

        const state = entireGame.getChildGameState<SelectRegionGameState<any>>(SelectRegionGameState);
        const player = ingame.players.get(botUser);

        if (ingame.getControllerOfHouse(state.house) !== player) return false;
        if (state.regions.length === 0) return false;

        const chosenRegion = state.regions[0];

        entireGame.onClientMessage(botUser, { type: "select-region", region: chosenRegion.id });
        return true;
    }

    protected useValyrianSteelBlade(entireGame: EntireGame, botUser: User): boolean {
        const ingame = entireGame.ingameGameState;
        if (!ingame) return false;

        const state = entireGame.getChildGameState<UseValyrianSteelBladeGameState>(
            UseValyrianSteelBladeGameState
        );
        const player = ingame.players.get(botUser);

        if (ingame.getControllerOfHouse(state.house) !== player) return false;

        entireGame.onClientMessage(botUser, { type: "use-valyrian-steel-blade", use: false });
        return true;
    }

    protected declareSupport(entireGame: EntireGame, botUser: User): boolean {
        const ingame = entireGame.ingameGameState;
        if (!ingame) return false;

        const state = entireGame.getChildGameState<DeclareSupportGameState>(
            DeclareSupportGameState
        );
        const player = ingame.players.get(botUser);

        if (ingame.getControllerOfHouse(state.house) !== player) return false;

        // FLAGGED: always declines support (supportedHouseId: null). Real strategy would
        // need CombatGameState's data to know who's fighting whom and the current
        // strength/allegiance situation - don't have that file, so not guessing at it.
        entireGame.onClientMessage(botUser, {
            type: "declare-support",
            supportedHouseId: null
        });

        return true;
    }

    protected selectOrders(entireGame: EntireGame, botUser: User): boolean {
        const ingame = entireGame.ingameGameState;
        if (!ingame) return false;

        const state = entireGame.getChildGameState<SelectOrdersGameState<any>>(
            SelectOrdersGameState
        );
        const player = ingame.players.get(botUser);

        if (ingame.getControllerOfHouse(state.house) !== player) return false;

        // SimpleBot: just take the first `count` regions offered.
        const chosen = state.possibleRegions.slice(0, state.count);

        entireGame.onClientMessage(botUser, {
            type: "select-orders",
            regions: chosen.map((r) => r.id)
        });

        return true;
    }

    protected reconcileArmies(entireGame: EntireGame, botUser: User): boolean {
        const ingame = entireGame.ingameGameState;
        if (!ingame) return false;

        const state = entireGame.getChildGameState<PlayerReconcileArmiesGameState>(
            PlayerReconcileArmiesGameState
        );
        const player = ingame.players.get(botUser);
        if (ingame.getControllerOfHouse(state.house) !== player) return false;

        const allUnits = state.getAllArmyUnitsOfHouse(state.house);
        let removedUnits = new BetterMap<Region, Unit[]>();

        for (const unit of allUnits) {
            if (state.isEnoughToReconcile(removedUnits)) break;
            const current = removedUnits.tryGet(unit.region, []);
            removedUnits.set(unit.region, [...current, unit]);
        }

        if (!state.isEnoughToReconcile(removedUnits)) return false;

        let prunedSomething = true;
        while (prunedSomething) {
            prunedSomething = false;

            outer: for (const [region, units] of removedUnits.entries) {
                for (const unit of units) {
                    const candidate = new BetterMap(removedUnits.entries);
                    const remaining = units.filter((u) => u.id !== unit.id);
                    if (remaining.length > 0) candidate.set(region, remaining);
                    else candidate.delete(region);

                    if (state.isEnoughToReconcile(candidate)) {
                        removedUnits = candidate;
                        prunedSomething = true;
                        break outer;
                    }
                }
            }
        }

        entireGame.onClientMessage(botUser, {
            type: "reconcile-armies",
            unitsToRemove: removedUnits.entries.map(([region, units]) => [
                region.id,
                units.map((u) => u.id)
            ])
        });

        return true;
    }

    protected resolveSingleRaidOrder(entireGame: EntireGame, botUser: User): boolean {
        const ingame = entireGame.ingameGameState;
        if (!ingame) return false;

        const state = entireGame.getChildGameState<ResolveSingleRaidOrderGameState>(
            ResolveSingleRaidOrderGameState
        );
        const player = ingame.players.get(botUser);
        if (ingame.getControllerOfHouse(state.house) !== player) return false;

        const regionsWithRaidOrders = state.resolveRaidOrderGameState.getRegionsWithRaidOrderOfHouse(
            state.house
        );
        if (regionsWithRaidOrders.length === 0) return false;

        let chosenRegion = regionsWithRaidOrders[0][0];
        let target = null as ReturnType<typeof state.getRaidableRegions>[number] | null;

        for (const [region, orderType] of regionsWithRaidOrders) {
            const targets = state.getRaidableRegions(region, orderType);
            if (targets.length > 0) {
                chosenRegion = region;
                target = targets[0];
                break;
            }
        }

        entireGame.onClientMessage(botUser, {
            type: "resolve-raid",
            orderRegionId: chosenRegion.id,
            targetRegionId: target ? target.id : null
        });

        return true;
    }

    protected resolveSingleConsolidatePower(entireGame: EntireGame, botUser: User): boolean {
        const ingame = entireGame.ingameGameState;
        if (!ingame) return false;

        const state = entireGame.getChildGameState<ResolveSingleConsolidatePowerGameState>(
            ResolveSingleConsolidatePowerGameState
        );
        const player = ingame.players.get(botUser);
        if (ingame.getControllerOfHouse(state.house) !== player) return false;

        const availableOrders = state.parentGameState.getAvailableOrdersOfHouse(state.house);
        if (availableOrders.entries.length === 0) return false;

        const [region, orderType] = availableOrders.entries[0];

        if (orderType instanceof DefenseMusterOrderType) {
            entireGame.onClientMessage(botUser, {
                type: "resolve-consolidate-power-choice",
                region: region.id,
                musterUnits: true
            });
            return true;
        }

        if (orderType instanceof ConsolidatePowerOrderType) {
            // FLAGGED: always takes tokens rather than weighing mustering - simplest safe default.
            entireGame.onClientMessage(botUser, {
                type: "resolve-consolidate-power-choice",
                region: region.id,
                gainPowerTokens: true
            });
            return true;
        }

        if (orderType instanceof IronBankOrderType) {
            // FLAGGED: always declines the loan rather than reasoning about
            // affordability/value - don't have IronBank's interest/cost logic in front of me.
            entireGame.onClientMessage(botUser, {
                type: "resolve-consolidate-power-choice",
                region: region.id,
                ignoreAndRemoveOrder: true
            });
            return true;
        }

        return false;
    }
}