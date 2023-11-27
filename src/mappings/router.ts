import assert from "assert";
import {
  DepositLog,
  HighLog,
  LowLog,
  SettlePositionLog,
  WithdrawalLog,
} from "../types/abi-interfaces/ControllerAbi";
import {
  getOrCreateDeposit,
  getOrCreatePosition,
  getOrCreateWithdrawal,
} from "./utils";
import { Option } from "../types";

export async function handleDeposit(log: DepositLog): Promise<void> {
  logger.info(`New deposit transaction log at block ${log.blockNumber}`);
  assert(log.args, "No log.args");

  let deposit = await getOrCreateDeposit(log);
  await deposit.save();
}

export async function handleLowerOption(log: LowLog): Promise<void> {
  logger.info(`New low option transaction log at block ${log.blockNumber}`);
  assert(log.args, "No log.args");

  let { position } = await getOrCreatePosition(log, Option.LOW);
  await position.save();
}

export async function handleHigherOption(log: HighLog): Promise<void> {
  logger.info(`New high option transaction log at block ${log.blockNumber}`);
  assert(log.args, "No log.args");

  let { position } = await getOrCreatePosition(log, Option.HIGH);
  await position.save();
}

export async function handleWithdrawal(log: WithdrawalLog): Promise<void> {
  logger.info(`New withdrawal transaction log at block ${log.blockNumber}`);
  assert(log.args, "No log.args");

  let withdrawal = await getOrCreateWithdrawal(log);
  await withdrawal.save();
}

export async function handlePositionSettled(
  log: SettlePositionLog
): Promise<void> {
  logger.info(
    `New position settlement transaction log at block ${log.blockNumber}`
  );
  assert(log.args, "No log.args");
}
