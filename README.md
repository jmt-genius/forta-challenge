# Uniswap-Bot

## Description

This Forta Bot detects swaps made on Uniswap V3.

## Supported Chains

- Ethereum
- Arbitrum
- Optimism
- Polygon

## Alerts

Alerts fired by this Bot

- FORTA-1
  - Fired when a transaction contains a Swap event that is from Uniswap V3
  - Severity is always set to "info"
  - Type is always set to "info"
  - Metadata contains:
    - poolAddress: The address of Uniswap V3 Pool smart contract
    - sender: The address of the account that initiated the Swap
    - receipient: The address of the account that received the swapped tokens
    - amount0: The amount of token0 swapped
    - amount1: The amount of token1 swapped
    - liquidity: The amount of liquidity in the Swap

## Test Data

The forta bot behaviour can be verified with the following transactions:

- 0xaa9e3cc23e02d38e6f86165ed4d7a25333e19186a4a6101ae0a9110dcfeab9b7