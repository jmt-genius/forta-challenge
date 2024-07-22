import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";

// Define the ABI strings for the create, update, and delete agent functions
const CREATE_FUNCTION_ABI: string = "function createAgent(uint256 agentId, address, string metadata, uint256[] chainIds) external";
const UPDATE_FUNCTION_ABI: string = "function updateAgent(uint256 agentId, string metadata, uint256[] chainIds) public";
const DELETE_FUNCTION_ABI: string = "function deleteAgent(uint256 agentId) public";

// Define the addresses for the registry and the deployer
const REGISTRY_ADDRESS: string = "0x61447385B019187daa48e91c55c02AF1F1f3F863";
const BOT_DEPLOYER_ADDRESS: string = "0x88dC3a2284FA62e0027d6D6B1fCfDd2141a143b8";

import { createFinding } from "./findings";

// Function to create the handleTransaction function with injected dependencies
export function provideHandleTransaction(
  deployerAddress: string,
  fortaAgentsRegistry: string,
  createFunctionAbi: string,
  updateFunctionAbi: string,
  deleteFunctionAbi: string
): HandleTransaction {
  return async function handleTransaction(txEvent: TransactionEvent) {
    const findings: Finding[] = [];

    // Check that the transaction is from the deployerAddress
    if (txEvent.from.toLowerCase() !== deployerAddress.toLowerCase()) return findings;

    // Filter the transaction logs for bot creation, update, and delete events
    const agentEvents = txEvent.filterFunction([createFunctionAbi, updateFunctionAbi, deleteFunctionAbi], fortaAgentsRegistry);

    // If no agent events are found, return empty findings
    if (!agentEvents.length) return findings;

    // Loop through each event and create a finding based on the event type
    agentEvents.forEach((event) => {
      if (event.signature.includes("createAgent")) {
        findings.push(createFinding("Creation", txEvent.from, event.args));
      } else if (event.signature.includes("updateAgent")) {
        findings.push(createFinding("Update", txEvent.from, event.args));
      } else if (event.signature.includes("deleteAgent")) {
        findings.push(createFinding("Deletion", txEvent.from, event.args));
      }
    });

    return findings;
  };
}

// Export the handleTransaction function with the specific configuration
export default {
  handleTransaction: provideHandleTransaction(
    BOT_DEPLOYER_ADDRESS,
    REGISTRY_ADDRESS,
    CREATE_FUNCTION_ABI,
    UPDATE_FUNCTION_ABI,
    DELETE_FUNCTION_ABI
  ),
};
