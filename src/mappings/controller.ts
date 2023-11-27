import assert from "assert";
import {
  CreateMarketLog,
  DepositLog,
  HighLog,
  LowLog,
  NewRoundLog,
  PositionErrorLog,
  SetProtocolFeeLog,
  SettlePositionLog,
  SettleRoundLog,
  WithdrawalLog,
} from "../types/abi-interfaces/ControllerAbi";
import { Market, Position, Round } from "../types/models";
import { Newtworks, Option, StatusCode } from "../types";
import {
  generateRoundId,
  getAccount,
  getOrCreateDeposit,
  getOrCreatePosition,
  getOrCreateWithdrawal,
} from "./utils";

export async function handleControllerDeposit(log: DepositLog): Promise<void> {
  logger.info(`New deposit transaction log at block ${log.blockNumber}`);
  assert(log.args, "No log.args");

  let account = await getAccount(log.args.account);

  const amount = log.args.amount.toBigInt();
  account.balance += amount;

  let deposit = await getOrCreateDeposit(log);
  deposit.isCompleted = true;
  deposit.updatedAt = log.block.timestamp;

  await account.save();
  await deposit.save();
}

export async function handleLow(log: LowLog): Promise<void> {
  logger.info(`New low option transaction log at block ${log.blockNumber}`);
  assert(log.args, "No log.args");

  let roundId = generateRoundId(log.args.id, log.args.roundId.toHexString());
  let round = await Round.get(roundId);
  let market = await Market.get(log.args.id);
  let account = await getAccount(log.args.account);
  const stake = log.args.stake.toBigInt();

  if (round && market) {
    let { position, prevOption, prevStake } = await getOrCreatePosition(
      log,
      Option.LOW,
      Newtworks.KLAYTN
    );

    position.isOpen = true;
    account.balance -= log.args.stake.toBigInt();
    round.totalStake += stake;
    market.lowVolume += stake;

    if (prevOption && prevStake) {
      round.totalStake -= prevStake;
      if (prevOption == Option.LOW) {
        market.lowVolume -= prevStake;
      } else {
        market.highVolume -= prevStake;
      }
    }

    await account.save();
    await market.save();
    await position.save();
  }
}

export async function handleHigh(log: HighLog): Promise<void> {
  logger.info(`New high option transaction log at block ${log.blockNumber}`);
  assert(log.args, "No log.args");

  let round = await Round.get(log.args.roundId.toString());
  let account = await getAccount(log.args.account);
  let market = await Market.get(log.args.id);

  const stake = log.args.stake.toBigInt();

  if (round && market) {
    let { position, prevOption, prevStake } = await getOrCreatePosition(
      log,
      Option.HIGH,
      Newtworks.KLAYTN
    );

    position.isOpen = true;
    account.balance -= log.args.stake.toBigInt();
    round.totalStake += stake;
    market.volume += stake;
    market.highVolume += stake;

    if (prevOption && prevStake) {
      round.totalStake -= prevStake;
      if (prevOption == Option.LOW) {
        market.lowVolume -= prevStake;
      } else {
        market.highVolume -= prevStake;
      }
    }

    await account.save();
    await market.save();
    await position.save();
  }
}

export async function handleControllerWithdrawal(
  log: WithdrawalLog
): Promise<void> {
  logger.info(`New withdrawal transaction log at block ${log.blockNumber}`);
  assert(log.args, "No log.args");

  const account = await getAccount(log.args.account);

  let withdrawal = await getOrCreateWithdrawal(log);
  withdrawal.isCompleted = true;
  withdrawal.completedOn = log.block.timestamp;

  account.balance -= log.args.amount.toBigInt();

  await account.save();
  await withdrawal.save();
}

export async function handleControllerPositionSettled(
  log: SettlePositionLog
): Promise<void> {
  logger.info(
    `New position settlement transaction log at block ${log.blockNumber}`
  );
  assert(log.args, "No log.args");

  let account = await getAccount(log.args.account);
  let position = await Position.get(log.args.positionId);
  let claimedAmount = log.args.amount.toBigInt();

  account.balance += claimedAmount;
  if (position) {
    position.isRewardClaimed = true;
    position.rewardAmountClaimed = claimedAmount;

    await position.save();
  }

  await account.save();
}

export async function handleControllerRoundSettled(
  log: SettleRoundLog
): Promise<void> {
  logger.info(`New settle round transaction log at block ${log.blockNumber}`);
  assert(log.args, "No log.args");

  let round = await Round.get(log.args.id);

  if (round) {
    round.closingPrice = log.args.closingPrice.toBigInt();
    round.isFinalized = true;
    round.totalWinningStake = log.args.totalWinningStake.toBigInt();

    await round.save();
  }
}

export async function handleNewRound(log: NewRoundLog): Promise<void> {
  logger.info(`New round transaction log at block ${log.blockNumber}`);
  assert(log.args, "No log.args");

  let market = await Market.get(log.args.id);

  let round = Round.create({
    id: log.args.roundId.toString(),
    openingTime: log.args.openingTime.toBigInt(),
    closingTime: log.args.closingTime.toBigInt(),
    entryDeadline: log.args.entryDeadline.toBigInt(),
    marketId: log.args.id,
    rewardPool: BigInt(0),
    totalStake: BigInt(0),
    totalWinningStake: BigInt(0),
    isFinalized: false,
  });

  if (market) {
    market.roundCount += BigInt(1);
    await market.save();
  }

  await round.save();
}

export async function handleCreateMarket(log: CreateMarketLog): Promise<void> {
  logger.info(
    `New market creation transaction log at block ${log.blockNumber}`
  );
  assert(log.args, "No log.args");

  let market = await Market.get(log.args.marketId);

  if (!market) {
    market = Market.create({
      id: log.args.marketId,
      oracleId: log.args.oracleId,
      currency: log.args.currency,
      protocolFee: BigInt(log.args.protocolFee),
      deadline: log.args.deadline.toBigInt(),
      duration: log.args.duration.toBigInt(),
      volume: BigInt(0),
      highVolume: BigInt(0),
      lowVolume: BigInt(0),
      paused: false,
      roundCount: BigInt(0),
    });

    await market.save();
  }
}

export async function handleSetProtocolFee(
  log: SetProtocolFeeLog
): Promise<void> {
  logger.info(
    `New protocol fee setup transaction log at block ${log.blockNumber}`
  );
  assert(log.args, "No log.args");

  let market = await Market.get(log.args.id);
  if (market) {
    market.protocolFee = BigInt(log.args.newFee);
    await market.save();
  }
}

export async function handlePositionError(
  log: PositionErrorLog
): Promise<void> {
  logger.info(`New position transaction log at block ${log.blockNumber}`);
  assert(log.args, "No log.args");

  let position = await Position.get(log.args.positionId);

  if (position) {
    position.status = Object.values(StatusCode)[log.args.errorCode];
    position.save();
  }
}
