# Nethermind Forta Bot

## Description

This project implements a Forta bot to monitor bot deployments, updates, and deletions by Nethermind. The bot generates alerts whenever a bot is created, updated, or deleted, helping to ensure transparency and traceability of bot management activities.

## Supported Chains

- Ethereum (Mainnet and Testnets)
- Any EVM-compatible chain

## Alerts

The bot generates the following alerts:

1. **Bot Deployment**
   - **Alert ID**: NETH-1
   - **Description**: A new bot has been deployed by Nethermind.
   - **Severity**: Info
   - **Type**: Info
   - **Metadata**:
     - `agentId`: The ID of the deployed agent.
     - `metadata`: Metadata associated with the agent.
     - `chainIds`: Chain IDs the agent is deployed on.

2. **Bot Update**
   - **Alert ID**: NETH-2
   - **Description**: An existing bot has been updated by Nethermind.
   - **Severity**: Info
   - **Type**: Info
   - **Metadata**:
     - `agentId`: The ID of the updated agent.
     - `metadata`: Updated metadata associated with the agent.
     - `chainIds`: Chain IDs the agent is deployed on.

3. **Bot Deletion**
   - **Alert ID**: NETH-3
   - **Description**: A bot has been deleted by Nethermind.
   - **Severity**: Info
   - **Type**: Info
   - **Metadata**:
     - `agentId`: The ID of the deleted agent.

## Test Data

The test suite is designed to validate the functionality of the bot. It includes the following tests:

1. **No Bots Deployed**
   - Ensures no findings are generated when no bots are deployed.

2. **Transaction Not From Deployer**
   - Ensures no findings are generated when the transaction is not from the deployer address.

3. **Bot Deployment**
   - Verifies that a finding is generated when a bot is deployed by the specified deployer address.

4. **Bot Update**
   - Verifies that a finding is generated when a bot is updated by the specified deployer address.

5. **Bot Deletion**
   - Verifies that a finding is generated when a bot is deleted by the specified deployer address.

6. **Multiple Bot Actions in One Transaction**
   - Ensures the bot can handle multiple createAgent, updateAgent, and deleteAgent function calls within a single transaction and generate the correct findings for each action.
