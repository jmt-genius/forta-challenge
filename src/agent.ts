import {
  BlockEvent,
  Finding,
  FindingSeverity, 
  FindingType, 
  Alert,
  Initialize,
  HandleBlock,
  getEthersProvider,
  getAlerts,
  GetAlerts,
} from "forta-agent";
import { ethers, Contract, BigNumber } from "ethers";


export const L1_ESCROW_OPTIMISM = "0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65";
export const L1_ESCROW_ARBITRUM = "0xA10c7CE4b876998858b1a9E12b10092229539400";

export const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

export const L1_ESCROW_FUNCTION_SIGNATURE = [
  "function balanceOf(address) view returns (uint256)",
];
export const L2_FUNCTION_SIGNATURE = [
  "function totalSupply() view returns (uint256)",
];
export const L2_TOKEN_ADDRESS_MAKER_DAO =
  "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1";

export const BOT_ID = "";

export type previousBalances = {
  previousBlockNumber: number;
  prevArbitrumBalance: BigNumber;
  prevOptimismBalance: BigNumber;
};


export const getL1Finding = async (
  daiContract: Contract,
  blockNumber: number,
  escrowAddressArbitrum: string,
  escrowAddressOptimism: string,
  previousBalances: previousBalances,
) => {
  const arbitrumBalance: BigNumber = await daiContract.balanceOf(
    escrowAddressArbitrum,
    {
      blockTag: blockNumber,
    },
  );
  const optimismBalance: BigNumber = await daiContract.balanceOf(
    escrowAddressOptimism,
    {
      blockTag: blockNumber,
    },
  );

  if (
    previousBalances.prevArbitrumBalance != arbitrumBalance &&
    previousBalances.prevOptimismBalance != optimismBalance
  ) {
    previousBalances.prevArbitrumBalance = arbitrumBalance;
    previousBalances.prevOptimismBalance = optimismBalance;
    previousBalances.previousBlockNumber = blockNumber;

    return Finding.fromObject({
      name: `Combined supply of optimism and Arbitrum MakerDao escrows on layer 1`,
      description: `Escrow balances: Arbitrum: ${arbitrumBalance} Optimism: ${optimismBalance}`,
      alertId: "new block check escrows on layer 1",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "Ethereum",
      metadata: {
        escrowBalanceOptimism: `${optimismBalance}`,
        escrowBalanceArbitrum: `${arbitrumBalance}`,
      },
    });
  }
  return [];
};

export const checkBlock = async (
  provider: ethers.providers.Provider,
  blockNumber: number,
  chainId: number,
  alert: Alert[],
): Promise<Array<Finding>> => {
  const l2Contract = new Contract(
    L2_TOKEN_ADDRESS_MAKER_DAO,
    L2_FUNCTION_SIGNATURE,
    provider,
  );
  const l2Balance = await l2Contract.totalSupply({ blockTag: blockNumber });

  if (alert.length == 0) {
    return [];
  }

  const l2Network = chainId === 42161 ? "Arbitrum" : "Optimism";
  const l1Balance =
    chainId === 42161
      ? alert[0].metadata.escrowBalanceArbitrum
      : alert[0].metadata.escrowBalanceOptimism;

  if (l2Balance.gt(l1Balance)) {
    return [
      Finding.fromObject({
        name: `${l2Network} layer 2 dai supply is more then the layer 1 escrow dai balance`,
        description: `L1Escrow Balance: ${l1Balance}, ${l2Network} L2Supply Balance: ${l2Balance}`,
        alertId: `L1 ${l2Network} supply issue`,
        severity: FindingSeverity.High,
        type: FindingType.Degraded,
        protocol: `${l2Network}`,
        metadata: {
          L1Bal: `${l1Balance}`,
          L2Bal: `${l2Balance}`,
        },
      }),
    ];
  }

  return [];
};


export const createContract = (
  contractAddress: string,
  provider: ethers.providers.Provider,
  contractABI: string[],
) => {
  return new Contract(contractAddress, contractABI, provider);
};


let chainId: number;
let prevBal: previousBalances = {
  previousBlockNumber: 0,
  prevArbitrumBalance: BigNumber.from(0),
  prevOptimismBalance: BigNumber.from(0),
};

export function provideInitialize(provider: ethers.providers.Provider) {
  return async function initialize() {
    const networkInfo = await provider.getNetwork();
    chainId = networkInfo.chainId;
  };
}

export function provideHandleBlock(
  provider: ethers.providers.Provider,
  getAlerts: GetAlerts,
): HandleBlock {
  return async function handleBlock(block: BlockEvent): Promise<Finding[]> {
    const findings: Finding[] = [];

    try {
      if (chainId == 1) {
        const daiContract = new Contract(
          DAI_ADDRESS,
          L1_ESCROW_FUNCTION_SIGNATURE,
          provider,
        );
        const result = await getL1Finding(
          daiContract,
          block.blockNumber,
          L1_ESCROW_ARBITRUM,
          L1_ESCROW_OPTIMISM,
          prevBal,
        );

        if (Array.isArray(result)) {
          findings.push(...result);
        } else if (result instanceof Finding) {
          findings.push(result);
        }
      } else {
        //Listen to alerts
        const alerts = await getAlerts({
          botIds: [BOT_ID],
          alertId: "L1-BLOCK-CHECK-ESCROWS",
          chainId: 1,
        });

        const blockFindings = await checkBlock(
          provider,
          block.blockNumber,
          chainId,
          alerts.alerts,
        );

        if (blockFindings.length > 0) {
          findings.push(...blockFindings);
        }
      }
    } catch (e) {
      return findings;
    }

    return findings;
  };
}

export default {
  handleBlock: provideHandleBlock(getEthersProvider(), getAlerts),
  initialize: provideInitialize(getEthersProvider()),
};
