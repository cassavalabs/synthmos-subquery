import assert from "assert";
import {
  CreateMarketLog,
  DepositLog,
  HighLog,
  LowLog,
  NewRoundLog,
  SetProtocolFeeLog,
  SettlePositionLog,
  SettleRoundLog,
  WithdrawalLog,
} from "../types/abi-interfaces/ControllerAbi";
import {
  Account,
  Deposit,
  Market,
  Position,
  Round,
  Withdrawal,
} from "../types/models";
import { Option } from "../types";

async function getAccount(address: string) {
  let account = await Account.get(address);

  if (account != null) {
    return account;
  }

  account = Account.create({
    id: address,
    balance: BigInt(0),
  });

  await account.save();

  return account;
}

const generateRoundId = (marketId: string, roundId: string): string =>
  `${marketId}-${roundId}`;

export async function handleDeposit(log: DepositLog): Promise<void> {
  logger.info(`New deposit transaction log at block ${log.blockNumber}`);
  assert(log.args, "No log.args");

  let account = await getAccount(log.args.account);
  account.balance += log.args.amount.toBigInt();

  let deposit = Deposit.create({
    id: log.transactionHash,
    accountId: account.id,
    currency: log.args.currency,
    amount: log.args.amount.toBigInt(),
    createdAt: log.block.timestamp,
  });

  await account.save();
  await deposit.save();
}

export async function handleLowerOption(log: LowLog): Promise<void> {
  logger.info(`New low option transaction log at block ${log.blockNumber}`);
  assert(log.args, "No log.args");

  let roundId = generateRoundId(log.args.id, log.args.roundId.toHexString());
  let round = await Round.get(roundId);
  let market = await Market.get(log.args.id);
  let account = await getAccount(log.args.account);

  if (round && market) {
    const id = log.args.positionId;
    let position = Position.create({
      id,
      accountId: account.id,
      roundId: round.id,
      price: log.args.price.toBigInt(),
      option: Option.LOW,
      share: log.args.stake.toBigInt(),
      isRewardClaimed: false,
      createdAt: log.block.timestamp,
    });

    round.volume = round.volume + log.args.stake.toBigInt();
    market.lowVolume = market.lowVolume + log.args.stake.toBigInt();

    await market.save();
    await position.save();
  }
}

export async function handleHigherOption(log: HighLog): Promise<void> {
  logger.info(`New high option transaction log at block ${log.blockNumber}`);
  assert(log.args, "No log.args");

  let round = await Round.get(log.args.roundId.toString());
  let market = await Market.get(log.args.id);
  let account = await getAccount(log.args.account);

  if (round && market) {
    const id = log.args.positionId;
    let position = Position.create({
      id,
      accountId: account.id,
      roundId: round.id,
      price: log.args.price.toBigInt(),
      option: Option.HIGH,
      share: log.args.stake.toBigInt(),
      isRewardClaimed: false,
      createdAt: log.block.timestamp,
    });

    round.volume = round.volume + log.args.stake.toBigInt();
    market.volume = market.volume + log.args.stake.toBigInt();
    market.lowVolume = market.lowVolume + log.args.stake.toBigInt();

    await market.save();
    await position.save();
  }
}

export async function handleWithdrawal(log: WithdrawalLog): Promise<void> {
  logger.info(`New withdrawal transaction log at block ${log.blockNumber}`);
  assert(log.args, "No log.args");

  const account = await getAccount(log.args.account);
  let withdrawal = Withdrawal.create({
    id: log.args.account,
    accountId: account.id,
    amount: log.args.amount.toBigInt(),
    isCompleted: true,
    requestedOn: log.block.timestamp,
    completedOn: log.block.timestamp,
  });

  account.balance -= log.args.amount.toBigInt();

  await account.save();
  await withdrawal.save();
}

export async function handlePositionSettled(
  log: SettlePositionLog
): Promise<void> {
  logger.info(
    `New position settlement transaction log at block ${log.blockNumber}`
  );
  assert(log.args, "No log.args");

  let account = await getAccount(log.args.account);
  let position = await Position.get(log.args.positionId);

  account.balance += log.args.amount.toBigInt();
  if (position) {
    position.isRewardClaimed = true;
    position.rewardAmountClaimed = log.args.amount.toBigInt();

    await position.save();
  }

  await account.save();
}

export async function handleRoundSettled(log: SettleRoundLog): Promise<void> {
  logger.info(`New settle round transaction log at block ${log.blockNumber}`);
  assert(log.args, "No log.args");

  let round = await Round.get(log.args.id);

  if (round) {
    round.closingPrice = log.args.closingPrice.toBigInt();
    round.isFinalized = true;
    round.totalWinShare = log.args.totalWinningShare.toBigInt();

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
    volume: BigInt(0),
    totalWinShare: BigInt(0),
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
