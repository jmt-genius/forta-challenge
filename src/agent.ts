import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";

const CREATE_FUNCTION_ABI: string = "function createAgent(uint256 agentId, address owner, string metadata, uint256[] chainIds) public";
const UPDATE_FUNCTION_ABI: string = "function updateAgent(uint256 agentId, address owner, string metadata, uint256[] chainIds) public";
const DELETE_FUNCTION_ABI: string = "function deleteAgent(uint256 agentId) public";

const REGISTRY_ADDRESS: string = "0x61447385B019187daa48e91c55c02AF1F1f3F863";
const BOT_DEPLOYER_ADDRESS: string = "0x88dC3a2284FA62e0027d6D6B1fCfDd2141a143b8";

export function provideHandleTransaction(functionAbi: string, proxy: string, deployer: string): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    if (txEvent.from !== deployer.toLowerCase()) {
      return findings;
    }

    const createBotTx = txEvent.filterFunction(CREATE_FUNCTION_ABI, proxy);
    const updateBotTx = txEvent.filterFunction(UPDATE_FUNCTION_ABI, proxy);
    const deleteBotTx = txEvent.filterFunction(DELETE_FUNCTION_ABI, proxy);

    createBotTx.forEach((transaction) => {
      const { agentId, metadata, chainIds } = transaction.args;
      findings.push(
        Finding.fromObject({
          name: "Bot Deployment",
          description: "Bot Deployment by Nethermind",
          alertId: "NETH-1",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "Forta",
          metadata: {
            agentId: agentId.toString(),
            metadata,
            chainIds: chainIds.toString(),
          },
        })
      );
    });

    updateBotTx.forEach((transaction) => {
      const { agentId, metadata, chainIds } = transaction.args;
      findings.push(
        Finding.fromObject({
          name: "Bot Update",
          description: "Bot Update by Nethermind",
          alertId: "NETH-2",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "Forta",
          metadata: {
            agentId: agentId.toString(),
            metadata,
            chainIds: chainIds.toString(),
          },
        })
      );
    });

    deleteBotTx.forEach((transaction) => {
      const { agentId } = transaction.args;
      findings.push(
        Finding.fromObject({
          name: "Bot Deletion",
          description: "Bot Deletion by Nethermind",
          alertId: "NETH-3",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "Forta",
          metadata: {
            agentId: agentId.toString(),
          },
        })
      );
    });

    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(CREATE_FUNCTION_ABI, REGISTRY_ADDRESS, BOT_DEPLOYER_ADDRESS),
};
