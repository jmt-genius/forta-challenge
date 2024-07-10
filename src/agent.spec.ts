import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { createAddress } from "forta-agent-tools";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { Interface } from "ethers/lib/utils";
import { BigNumber } from "ethers";

const CREATE_FUNCTION_ABI: string = "function createAgent(uint256 agentId, address owner, string metadata, uint256[] chainIds) public";
const UPDATE_FUNCTION_ABI: string = "function updateAgent(uint256 agentId, address owner, string metadata, uint256[] chainIds) public";
const DELETE_FUNCTION_ABI: string = "function deleteAgent(uint256 agentId) public";
const REGISTRY_ADDRESS: string = "0x61447385B019187daa48e91c55c02AF1F1f3F863";
const BOT_DEPLOYER_ADDRESS: string = "0x88dC3a2284FA62e0027d6D6B1fCfDd2141a143b8";

const TEST_ADDRESS = createAddress("0x123abc");

const MOCK_METADATA = {
  agentId: "123",
  metadata: "abcd",
  chainIds: ["137"],
};

const MOCK_METADATA2 = {
  agentId: "12345678",
  metadata: "abcdefg",
  chainIds: ["137"],
};

const MOCK_FINDING = (alertId: string, name: string, agentId: string, metadata: string = "", chainIds: string = ""): Finding => {
  return Finding.fromObject({
    name: name,
    description: `${name} by Nethermind`,
    alertId: alertId,
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Forta",
    metadata: {
      agentId: agentId,
      ...(metadata && { metadata }),
      ...(chainIds && { chainIds }),
    },
  });
};

describe("Bot deployment, update, and deletion tracker", () => {
  let handleTransaction: HandleTransaction;
  let proxy = new Interface([CREATE_FUNCTION_ABI, UPDATE_FUNCTION_ABI, DELETE_FUNCTION_ABI]);
  let findings: Finding[];

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(CREATE_FUNCTION_ABI, REGISTRY_ADDRESS, BOT_DEPLOYER_ADDRESS);
  });

  it("should return no Findings if no bots deployed, updated, or deleted", async () => {
    const mockTxEvent: TransactionEvent = new TestTransactionEvent();
    findings = await handleTransaction(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return no Findings if tx is not sent from the deployer", async () => {
    const mockTxEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(TEST_ADDRESS)
      .setTo(REGISTRY_ADDRESS)
      .addTraces({
        to: REGISTRY_ADDRESS,
        function: proxy.getFunction("createAgent"),
        arguments: [
          MOCK_METADATA.agentId,
          TEST_ADDRESS,
          MOCK_METADATA.metadata,
          [BigNumber.from(MOCK_METADATA.chainIds[0])],
        ],
      });

    findings = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return Findings if tx is sent from the deployer to create agent", async () => {
    const mockTxEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(BOT_DEPLOYER_ADDRESS)
      .setTo(REGISTRY_ADDRESS)
      .addTraces({
        to: REGISTRY_ADDRESS,
        function: proxy.getFunction("createAgent"),
        arguments: [
          MOCK_METADATA.agentId,
          TEST_ADDRESS,
          MOCK_METADATA.metadata,
          [BigNumber.from(MOCK_METADATA.chainIds[0])],
        ],
      });

    findings = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([
      MOCK_FINDING("NETH-1", "Bot Deployment", MOCK_METADATA.agentId, MOCK_METADATA.metadata, MOCK_METADATA.chainIds[0]),
    ]);
  });

  it("should return Findings if tx is sent from the deployer to update agent", async () => {
    const mockTxEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(BOT_DEPLOYER_ADDRESS)
      .setTo(REGISTRY_ADDRESS)
      .addTraces({
        to: REGISTRY_ADDRESS,
        function: proxy.getFunction("updateAgent"),
        arguments: [
          MOCK_METADATA.agentId,
          TEST_ADDRESS,
          MOCK_METADATA.metadata,
          [BigNumber.from(MOCK_METADATA.chainIds[0])],
        ],
      });

    findings = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([
      MOCK_FINDING("NETH-2", "Bot Update", MOCK_METADATA.agentId, MOCK_METADATA.metadata, MOCK_METADATA.chainIds[0]),
    ]);
  });

  it("should return Findings if tx is sent from the deployer to delete agent", async () => {
    const mockTxEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(BOT_DEPLOYER_ADDRESS)
      .setTo(REGISTRY_ADDRESS)
      .addTraces({
        to: REGISTRY_ADDRESS,
        function: proxy.getFunction("deleteAgent"),
        arguments: [
          MOCK_METADATA.agentId,
        ],
      });

    findings = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([
      MOCK_FINDING("NETH-3", "Bot Deletion", MOCK_METADATA.agentId),
    ]);
  });

  it("should return Findings for multiple createAgent calls in one tx", async () => {
    const mockTxEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(BOT_DEPLOYER_ADDRESS)
      .setTo(REGISTRY_ADDRESS)
      .addTraces({
        to: REGISTRY_ADDRESS,
        function: proxy.getFunction("createAgent"),
        arguments: [
          MOCK_METADATA.agentId,
          TEST_ADDRESS,
          MOCK_METADATA.metadata,
          [BigNumber.from(MOCK_METADATA.chainIds[0])],
        ],
      })
      .addTraces({
        to: REGISTRY_ADDRESS,
        function: proxy.getFunction("createAgent"),
        arguments: [
          MOCK_METADATA2.agentId,
          TEST_ADDRESS,
          MOCK_METADATA2.metadata,
          [BigNumber.from(MOCK_METADATA2.chainIds[0])],
        ],
      });

    findings = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([
      MOCK_FINDING("NETH-1", "Bot Deployment", MOCK_METADATA.agentId, MOCK_METADATA.metadata, MOCK_METADATA.chainIds[0]),
      MOCK_FINDING("NETH-1", "Bot Deployment", MOCK_METADATA2.agentId, MOCK_METADATA2.metadata, MOCK_METADATA2.chainIds[0]),
    ]);
  });

  it("should return Findings for multiple updateAgent calls in one tx", async () => {
    const mockTxEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(BOT_DEPLOYER_ADDRESS)
      .setTo(REGISTRY_ADDRESS)
      .addTraces({
        to: REGISTRY_ADDRESS,
        function: proxy.getFunction("updateAgent"),
        arguments: [
          MOCK_METADATA.agentId,
          TEST_ADDRESS,
          MOCK_METADATA.metadata,
          [BigNumber.from(MOCK_METADATA.chainIds[0])],
        ],
      })
      .addTraces({
        to: REGISTRY_ADDRESS,
        function: proxy.getFunction("updateAgent"),
        arguments: [
          MOCK_METADATA2.agentId,
          TEST_ADDRESS,
          MOCK_METADATA2.metadata,
          [BigNumber.from(MOCK_METADATA2.chainIds[0])],
        ],
      });

    findings = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([
      MOCK_FINDING("NETH-2", "Bot Update", MOCK_METADATA.agentId, MOCK_METADATA.metadata, MOCK_METADATA.chainIds[0]),
      MOCK_FINDING("NETH-2", "Bot Update", MOCK_METADATA2.agentId, MOCK_METADATA2.metadata, MOCK_METADATA2.chainIds[0]),
    ]);
  });

  it("should return Findings for multiple deleteAgent calls in one tx", async () => {
    const mockTxEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(BOT_DEPLOYER_ADDRESS)
      .setTo(REGISTRY_ADDRESS)
      .addTraces({
        to: REGISTRY_ADDRESS,
        function: proxy.getFunction("deleteAgent"),
        arguments: [
          MOCK_METADATA.agentId,
        ],
      })
      .addTraces({
        to: REGISTRY_ADDRESS,
        function: proxy.getFunction("deleteAgent"),
        arguments: [
          MOCK_METADATA2.agentId,
        ],
      });

    findings = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([
      MOCK_FINDING("NETH-3", "Bot Deletion", MOCK_METADATA.agentId),
      MOCK_FINDING("NETH-3", "Bot Deletion", MOCK_METADATA2.agentId),
    ]);
  });
});
