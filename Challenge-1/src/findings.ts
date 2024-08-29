import { Finding, FindingSeverity, FindingType } from "forta-agent";

// Function to create a Finding object based on the event type and arguments
export const createFinding = (event: string, from: any, args: any) => {
  // Extract agentId, metadata, and chainIds from the args, with default values if not present
  const agentId = args.agentId;
  const metadata = args.metadata || "";
  const chainIds = args.chainIds || "";

  // Common properties for all findings
  const commonProps = {
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      deployer: from,
      agentId: agentId.toString(),
      metadata: metadata.toString(),
      chainIds: chainIds.toString(),
    },
  };

  // Specific properties for each type of finding (creation, update, deletion)
  const findingProps: Record<string, any> = {
    Creation: {
      description: `New bot created with id: ${agentId}`,
      alertId: "Nethermind-Bot-Creation",
    },
    Update: {
      description: `New update for bot with id: ${agentId}`,
      alertId: "Nethermind-Bot-Update",
    },
    Deletion: {
      description: `Bot deleted with id: ${agentId}`,
      alertId: "Nethermind-Bot-Deletion",
    },
  };

  // Return a new Finding object with the combined properties
  return Finding.fromObject({
    name: `Nethermind Bots ${event} Detector`,
    ...findingProps[event],
    ...commonProps,
  });
};
