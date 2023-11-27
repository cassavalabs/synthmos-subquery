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
import { Newtworks, Option } from "../types";

export async function handleDeposit(log: DepositLog): Promise<void> {
  logger.info(`New deposit transaction log at block ${log.blockNumber}`);
  assert(log.args, "No log.args");

  let deposit = await getOrCreateDeposit(log);
  await deposit.save();
}

async function _handleLow(_log: LowLog, _network: Newtworks): Promise<void> {
  logger.info(`New low option transaction log at block ${_log.blockNumber}`);
  assert(_log.args, "No log.args");

  let { position } = await getOrCreatePosition(_log, Option.LOW, _network);
  await position.save();
}

async function _handleHigh(_log: HighLog, _network: Newtworks): Promise<void> {
  logger.info(`New high option transaction log at block ${_log.blockNumber}`);
  assert(_log.args, "No log.args");

  let { position } = await getOrCreatePosition(_log, Option.HIGH, _network);
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

/**
 * handle remote positions
 */
export async function handleHighAvalanche(log: HighLog): Promise<void> {
  _handleHigh(log, Newtworks.AVALANCHE);
}

export async function handleLowAvalanche(log: LowLog): Promise<void> {
  _handleLow(log, Newtworks.AVALANCHE);
}

export async function handleHighBNB(log: HighLog): Promise<void> {
  _handleHigh(log, Newtworks.BNB);
}

export async function handleLowBNB(log: LowLog): Promise<void> {
  _handleLow(log, Newtworks.BNB);
}

export async function handleHighEthereum(log: HighLog): Promise<void> {
  _handleHigh(log, Newtworks.ETHEREUM);
}

export async function handleLowEthereum(log: LowLog): Promise<void> {
  _handleLow(log, Newtworks.ETHEREUM);
}

export async function handleHighMoonbeam(log: HighLog): Promise<void> {
  _handleHigh(log, Newtworks.MOONBEAM);
}

export async function handleLowMoonbeam(log: LowLog): Promise<void> {
  _handleLow(log, Newtworks.MOONBEAM);
}
