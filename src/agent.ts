import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType, getEthersProvider } from 'forta-agent';
import { ethers } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { LRUCache } from 'lru-cache';

// Uniswap constants and ABI
export const swapEvent =
  'event Swap (address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)';

export const UNISWAP_FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984';

export const UNI_INIT_CODE = '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54';

export const uniswapPoolABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)',
];

// LRU Cache for pool address verification
const poolAddressCache: LRUCache<string, boolean> = new LRUCache({ max: 1000000 });

// Utility functions
const getPoolValues = async (poolAddress: string, provider: Provider, blockNumber: number) => {
  const poolContract = new ethers.Contract(poolAddress, uniswapPoolABI, provider);
  const poolValues: any[] = await Promise.all([
    poolContract.token0({ blockTag: blockNumber }),
    poolContract.token1({ blockTag: blockNumber }),
    poolContract.fee({ blockTag: blockNumber }),
  ]);

  return poolValues;
};

export const computePoolAddress = (factoryAddress: string, poolValues: any[]) => {
  const encodedData = ethers.utils.defaultAbiCoder.encode(['address', 'address', 'uint24'], poolValues);
  const salt = ethers.utils.solidityKeccak256(['bytes'], [encodedData]);
  const poolAddress = ethers.utils.getCreate2Address(factoryAddress, salt, UNI_INIT_CODE);
  return poolAddress;
};

const isUniswapPoolAddress = async (
  factoryAddress: string,
  poolAddress: string,
  provider: Provider,
  blockNumber: number
) => {
  if (poolAddressCache.get(poolAddress)) return poolAddressCache.get(poolAddress);
  const poolValues = await getPoolValues(poolAddress, provider, blockNumber);
  const computedPoolAddress = computePoolAddress(factoryAddress, poolValues);
  const isUniswap = computedPoolAddress.toLowerCase() === poolAddress.toLowerCase();
  poolAddressCache.set(poolAddress, isUniswap);
  return isUniswap;
};

// Forta bot logic
export function provideHandleTransaction(
  factoryAddress: string,
  swapEvent: string,
  provider: Provider
): HandleTransaction {
  return async function handleTransaction(txEvent: TransactionEvent) {
    const findings: Finding[] = [];

    const logs = txEvent.filterLog(swapEvent);

    for (const log of logs) {
      const poolAddress = log.address;
      const isUniswapPool = await isUniswapPoolAddress(factoryAddress, poolAddress, provider, txEvent.blockNumber);
      if (!isUniswapPool) {
        continue;
      }

      const { sender, recipient, amount0, amount1, liquidity } = log.args;

      findings.push(
        Finding.fromObject({
          name: 'Uniswap V3 Swap Detector',
          description: 'This Bot detects the Swaps executed on Uniswap V3',
          alertId: 'FORTA-1',
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: 'UniswapV3',
          metadata: {
            poolAddress: poolAddress.toLowerCase(),
            sender,
            recipient,
            amount0: amount0.toString(),
            amount1: amount1.toString(),
            liquidity: liquidity.toString(),
          },
        })
      );
    }

    return findings;
  };
}

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(UNISWAP_FACTORY_ADDRESS, swapEvent, getEthersProvider()),
};
