import {
  EthereumProject,
  EthereumDatasourceKind,
  EthereumHandlerKind,
} from "@subql/types-ethereum";

const project: EthereumProject = {
  specVersion: "1.0.0",
  version: "0.0.1",
  name: "synthmos-subquery",
  description: "Subquery for the Synthmos protocol controller",
  runner: {
    node: {
      name: "@subql/node-ethereum",
      version: ">=3.0.0",
    },
    query: {
      name: "@subql/query",
      version: "*",
    },
  },
  schema: {
    file: "./schema.graphql",
  },
  network: {
    chainId: "1001",
    endpoint: ["https://klaytn.blockpi.network/v1/rpc/public"],
    // dictionary: "https://dict-tyk.subquery.network/query/klaytn"
  },
  dataSources: [
    {
      kind: EthereumDatasourceKind.Runtime,
      startBlock: 131206820,
      // This is the block that the contract was deployed on https://scope.klaytn.com/token/0x34d21b1e550d73cee41151c77f3c73359527a396
      options: {
        abi: "controller",
        address: "0x34d21b1e550d73cee41151c77f3c73359527a396",
      },
      assets: new Map([["controller", { file: "./abis/controller.abi.json" }]]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleDeposit",
            filter: {
              topics: [
                "Deposit(address indexed currency, bytes32 indexed account, uint256 amount)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleLowerOption",
            filter: {
              topics: [
                "Low(MarketId indexed id, uint256 indexed roundId, bytes32 indexed account, bytes32 positionId, int256 price, uint256 stake)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleHigherOption",
            filter: {
              topics: [
                "High(MarketId indexed id, uint256 indexed roundId, bytes32 indexed account, bytes32 positionId, int256 price, uint256 stake)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleWithdrawal",
            filter: {
              topics: [
                "Withdrawal(address indexed currency, bytes32 indexed account, uint256 amount)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handlePositionSettled",
            filter: {
              topics: [
                "SettlePosition(bytes32 indexed positionId, bytes32 indexed account, uint256 amount)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleRoundSettled",
            filter: {
              topics: [
                "SettleRound(MarketId indexed id, uint256 indexed roundId, uint256 totalStake, int256 closingPrice, uint256 protocolFee, uint256 totalWinningStake)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleNewRound",
            filter: {
              topics: [
                "NewRound(MarketId indexed id, uint256 indexed roundId, uint256 openingTime, uint256 closingTime, uint256 entryDeadline)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleCreateMarket",
            filter: {
              topics: [
                "CreateMarket(MarketId indexed marketId, bytes32 indexed oracleId, address indexed currency, address creator, uint8 protocolFee, uint256 deadline, uint256 duration)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleSetProtocolFee",
            filter: {
              topics: [
                "SetProtocolFee(MarketId indexed id, uint8 prevFee, uint8 newFee)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handlePositionError",
            filter: {
              topics: [
                "PositionError(bytes32 indexed positionId,Market.StatusCode errorCode)",
              ],
            },
          },
        ],
      },
    },
  ],
  repository: "https://github.com/cassavalabs/synthmos-subquery",
};

// Must set default to the project instance
export default project;
