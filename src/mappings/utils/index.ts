import assert from "assert";
import {
  DepositLog,
  HighLog,
  LowLog,
  WithdrawalLog,
} from "../../types/abi-interfaces/ControllerAbi";
import { Account, Deposit, Position, Withdrawal } from "../../types/models";
import { Option, StatusCode } from "../../types";

export async function getAccount(address: string) {
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

export const generateRoundId = (marketId: string, roundId: string): string =>
  `${marketId}-${roundId}`;

export async function getOrCreateDeposit(log: DepositLog) {
  assert(log.args, "No Logs");

  const depositId = log.args.requestId;
  let deposit = await Deposit.get(depositId);

  if (!deposit) {
    deposit = Deposit.create({
      id: depositId,
      accountId: log.args.account,
      currency: log.args.currency,
      amount: log.args.amount.toBigInt(),
      isCompleted: false,
      createdAt: log.block.timestamp,
    });
  }

  return deposit;
}

export async function getOrCreateWithdrawal(log: WithdrawalLog) {
  assert(log.args, "No Logs");

  const withdrawalId = log.args.requestId;
  let withdrawal = await Withdrawal.get(withdrawalId);

  if (!withdrawal) {
    withdrawal = Withdrawal.create({
      id: withdrawalId,
      accountId: log.args.account,
      amount: log.args.amount.toBigInt(),
      requestedOn: log.block.timestamp,
      isCompleted: false,
    });
  }

  return withdrawal;
}

export async function getOrCreatePosition(
  log: HighLog | LowLog,
  option: Option
) {
  assert(log.args, "No logs");

  let position = await Position.get(log.args.positionId);
  const prevStake = position?.stake;
  const prevOption = position?.option;

  if (!position) {
    position = Position.create({
      id: log.args.positionId,
      accountId: log.args.account,
      roundId: log.args.roundId.toString(),
      price: log.args.price.toBigInt(),
      option: option,
      stake: log.args.stake.toBigInt(),
      isRewardClaimed: false,
      isOpen: false,
      status: StatusCode.IN_PROGRESS,
      createdAt: log.block.timestamp,
    });
  }

  return { position, prevOption, prevStake };
}
