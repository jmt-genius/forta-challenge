import { Finding, FindingSeverity, FindingType, HandleTransaction, ethers } from 'forta-agent';
import { createAddress } from 'forta-agent-tools';
import { TestTransactionEvent, MockEthersProvider } from 'forta-agent-tools/lib/test';
import { provideHandleTransaction } from './agent';
import { swapEvent, uniswapPoolABI, UNI_INIT_CODE, UNISWAP_FACTORY_ADDRESS } from './agent'; // Import ABI and constants
import { computePoolAddress } from './agent'; // Import computeAddress function

describe('Uniswap V3 Swap Event Detector', () => {
  let handleTransaction: HandleTransaction;
  let Iface: ethers.utils.Interface;

  const mockFactoryAddress = createAddress(UNISWAP_FACTORY_ADDRESS);
  let mockProvider: MockEthersProvider;
  const mockRandomAddress = createAddress('0x6');

  const mockToken0 = createAddress('0x765');
  const mockToken1 = createAddress('0x987');
  const mockFee = 10000;

  const mockPoolValues = [mockToken0, mockToken1, mockFee];
  const mockPoolAddress = computePoolAddress(mockFactoryAddress, mockPoolValues);

  const mockSwapEventArgs = [
    createAddress('0x234'),
    createAddress('0x345'),
    ethers.BigNumber.from('-5378335736229591174395'),
    ethers.BigNumber.from('266508884993980604'),
    ethers.BigNumber.from('555620238891309147094159455'),
    ethers.BigNumber.from('14900188386820019615173'),
    -99206,
  ];

  beforeAll(() => {
    mockProvider = new MockEthersProvider();
    const provider = mockProvider as unknown as ethers.providers.Provider;
    handleTransaction = provideHandleTransaction(UNISWAP_FACTORY_ADDRESS, swapEvent, provider);
    Iface = new ethers.utils.Interface(uniswapPoolABI);
  });

  describe('handleTransaction', () => {
    let txEvent: TestTransactionEvent;

    beforeEach(() => {
      txEvent = new TestTransactionEvent();
      txEvent.setBlock(0);
    });

    const configProvider = (contractAddress: string) => {
      mockProvider.addCallTo(contractAddress, 0, Iface, 'token0', { inputs: [], outputs: [mockToken0] });
      mockProvider.addCallTo(contractAddress, 0, Iface, 'token1', { inputs: [], outputs: [mockToken1] });
      mockProvider.addCallTo(contractAddress, 0, Iface, 'fee', { inputs: [], outputs: [mockFee] });

      mockProvider.setLatestBlock(0);
    };

    it('ignores any txn that is not a Swap Event/Transaction', async () => {
      txEvent.setFrom(mockRandomAddress).setTo(mockPoolAddress).setValue('123456789');

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it('ignores any txn that is a Swap Event but is not a UniswapV3 Swap', async () => {
      txEvent.addEventLog(swapEvent, mockRandomAddress, mockSwapEventArgs);

      configProvider(mockRandomAddress);

      const findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it('returns findings when the Swap Event is a UniswapV3 Swap', async () => {
      txEvent.addEventLog(swapEvent, mockPoolAddress, mockSwapEventArgs);

      configProvider(mockPoolAddress);

      const findings = await handleTransaction(txEvent);

      expect(findings.length).toStrictEqual(1);
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: 'Uniswap V3 Swap Detector',
          description: 'This Bot detects the Swaps executed on Uniswap V3',
          alertId: 'FORTA-1',
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: 'UniswapV3',
          metadata: {
            poolAddress: mockPoolAddress.toLowerCase(),
            sender: mockSwapEventArgs[0].toString(),
            recipient: mockSwapEventArgs[1].toString(),
            amount0: mockSwapEventArgs[2].toString(),
            amount1: mockSwapEventArgs[3].toString(),
            liquidity: mockSwapEventArgs[5].toString(),
          },
        }),
      ]);
    });
  });
});
