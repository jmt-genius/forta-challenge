# MakerDAO Bridge Invariant Agent

## Description

This agent monitors the MakerDAO Bridge invariant by comparing the DAI balances between Layer 1 (Ethereum) and Layer 2 (Arbitrum, Optimism) chains. It helps ensure that the DAI supply is consistent across different layers of the blockchain.

## Supported Chains

- Ethereum
- Arbitrum
- Optimism

## Alerts

The agent fires alerts based on discrepancies between Layer 1 escrow DAI balances and Layer 2 DAI supplies:

- **FORTA-1**
  - **Condition**: Fired when the Layer 2 DAI supply is more than the Layer 1 escrow DAI balance.
  - **Severity**: Set to "medium" (mention any conditions where it could be something else).
  - **Type**: Set to "issue" (mention any conditions where it could be something else).
  - **Metadata**:
    - `L1Bal`: The Layer 1 escrow DAI balance.
    - `L2Bal`: The Layer 2 DAI supply.

## Test Data

The bot behaviour can be verified with the following block:

- [14020169](https://etherscan.io/block/14020169)

