import {
  EthereumProject,
  EthereumDatasourceKind,
  EthereumHandlerKind,
} from "@subql/types-ethereum";

const project: EthereumProject = {
  specVersion: "1.0.0",
  version: "0.0.1",
  name: "synthmos-subquery",
  description: "Subquery for the Synthmos protocol Moonbeam router",
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
    chainId: "1287",
    endpoint: [
      "https://rpc.testnet.moonbeam.network",
      "https://rpc.api.moonbase.moonbeam.network",
      "https://moonbase.unitedbloc.com:1000",
    ],
    dictionary: "https://dict-tyk.subquery.network/query/moonbeam"
  },
  dataSources: [
    {
      kind: EthereumDatasourceKind.Runtime,
      startBlock: 5575642,
      options: {
        abi: "router",
        address: "0x1bc16Bf9615cFd3733F10222b287194CC4953e47",
      },
      assets: new Map([["router", { file: "./abis/router.abi.json" }]]),
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
            handler: "handleLowMoonbeam",
            filter: {
              topics: [
                "Low(MarketId indexed id, uint256 indexed roundId, bytes32 indexed account, bytes32 positionId, int256 price, uint256 stake)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleHighMoonbeam",
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
        ],
      },
    },
  ],
  repository: "https://github.com/cassavalabs/synthmos-subquery",
};

// Must set default to the project instance
export default project;
