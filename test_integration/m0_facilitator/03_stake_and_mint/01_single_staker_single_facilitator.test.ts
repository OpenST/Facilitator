import BigNumber from 'bignumber.js';
import Web3 from 'web3';

import { TransactionObject } from '@openst/mosaic-contracts/dist/interacts/types';
import { EIP20Token } from '@openst/mosaic-contracts/dist/interacts/EIP20Token';
import { Account } from 'web3-eth-accounts';
import { EIP20Gateway } from '@openst/mosaic-contracts/dist/interacts/EIP20Gateway';
import { EIP20CoGateway } from '@openst/mosaic-contracts/dist/interacts/EIP20CoGateway';
import Utils from '../Utils';
import MessageTransferRequest from '../../../src/m0_facilitator/models/MessageTransferRequest';
import Message from '../../../src/m0_facilitator/models/Message';

import {
  MessageDirection,
  MessageStatus,
  MessageType,
} from '../../../src/m0_facilitator/repositories/MessageRepository';
import assert from '../../../test/test_utils/assert';
import AuxiliaryChain from '../../../src/m0_facilitator/models/AuxiliaryChain';
import SharedStorage from '../SharedStorage';

describe('stake and mint with single staker & facilitator process', async (): Promise<void> => {
  const testDuration = 3;
  const interval = 3000;
  const testData = SharedStorage.getTestData();
  const { stakeAmount } = testData;
  const { gasPrice } = testData;
  const { gasLimit } = testData;
  const { stakerValueTokenToFund } = testData;
  const helperObject = SharedStorage.getHelperObject();
  const { auxChainId } = testData;
  const gatewayAddresses = SharedStorage.getGatewayAddresses();
  const stakePool: string = gatewayAddresses.stakePoolAddress;

  let originWeb3: Web3;
  let auxiliaryWeb3: Web3;
  let utils: Utils;
  let valueTokenInstance: EIP20Token;
  let stakerAccount: Account;
  let messageHash: string | undefined;
  let generatedStakeRequestHash: string;
  let expectedMessage: Message;
  let anchoredBlockNumber: number;
  let messageTransferRequest: MessageTransferRequest;

  before(async () => {
    utils = new Utils();
    ({ originWeb3, auxiliaryWeb3 } = utils);
    valueTokenInstance = utils.getValueTokenInstance();
  });

  it('should fund staker', async (): Promise<void> => {
    stakerAccount = originWeb3.eth.accounts.create('facilitatortest');
    originWeb3.eth.accounts.wallet.add(stakerAccount);

    const transferRawTx: TransactionObject<boolean> = valueTokenInstance.methods.transfer(
      stakerAccount.address,
      stakerValueTokenToFund,
    );

    const transferReceipt = await Utils.sendTransaction(
      transferRawTx,
      {
        from: SharedStorage.getOriginFunder(),
        gasPrice: await originWeb3.eth.getGasPrice(),
      },
    );
    await utils.verifyValueTokenTransfer(
      transferReceipt,
      stakerAccount.address,
      new BigNumber(stakerValueTokenToFund),
    );

    await utils.fundEthOnOrigin(
      stakerAccount.address,
      new BigNumber(2),
    );

    const approveRawTx: TransactionObject<boolean> = valueTokenInstance.methods.approve(
      stakePool,
      stakeAmount,
    );

    await Utils.sendTransaction(
      approveRawTx,
      {
        from: stakerAccount.address,
        gasPrice: await originWeb3.eth.getGasPrice(),
      },
    );
  });

  it('should perform and verify request stake', async (): Promise<void> => {
    const stakeAndMintBeneficiaryAccount: Account = auxiliaryWeb3.eth.accounts.create('beneficiary');
    auxiliaryWeb3.eth.accounts.wallet.add(stakeAndMintBeneficiaryAccount);
    SharedStorage.setStakeAndMintBeneficiary(stakeAndMintBeneficiaryAccount.address);

    messageTransferRequest = new MessageTransferRequest(
      '',
      MessageType.Stake,
      new BigNumber(0), // It will be updated after stake request is done.
      new BigNumber(stakeAmount),
      stakeAndMintBeneficiaryAccount.address,
      new BigNumber(gasPrice),
      new BigNumber(gasLimit),
      new BigNumber(1),
      gatewayAddresses.eip20GatewayAddress,
      stakerAccount.address,
      '0x0000000000000000000000000000000000000001',
      null,
    );

    generatedStakeRequestHash = utils.getStakeRequestHash(
      messageTransferRequest,
      messageTransferRequest.gateway,
      stakePool,
    );

    const stakePoolInstance = utils.getStakePoolInstance();
    const requestStakeRawTx: TransactionObject<string> = stakePoolInstance.methods.requestStake(
      messageTransferRequest.amount.toString(10),
      messageTransferRequest.beneficiary,
      messageTransferRequest.gasPrice.toString(10),
      messageTransferRequest.gasLimit.toString(10),
      messageTransferRequest.nonce.toString(10),
      messageTransferRequest.gateway,
    );

    const receipt = await Utils.sendTransaction(
      requestStakeRawTx,
      {
        from: messageTransferRequest.sender,
        gasPrice: await originWeb3.eth.getGasPrice(),
      },
    );

    messageTransferRequest.blockNumber = new BigNumber(receipt.blockNumber);

    assert.strictEqual(
      receipt.status,
      true,
      'stake request receipt status should be true',
    );

    const stakeRequestHash = await stakePoolInstance.methods.stakeRequestHashes(
      messageTransferRequest.sender,
      messageTransferRequest.gateway,
    ).call();

    assert.strictEqual(
      generatedStakeRequestHash,
      stakeRequestHash,
      'Incorrect stake request hash',
    );

    let stakeRequestInterval: NodeJS.Timeout;
    const stakeRequestPromise = new Promise(((resolve, reject) => {
      const endTime = Utils.getEndTime(testDuration);
      stakeRequestInterval = setInterval(async () => {
        const messageTransferRequestDb: MessageTransferRequest | null = await
        utils.getMessageTransferRequest(
          generatedStakeRequestHash,
        );
        if (messageTransferRequestDb != null) {
          try {
            Utils.assertMessageTransferRequests(messageTransferRequestDb, messageTransferRequest);
          } catch (e) {
            reject(e);
          }
          resolve();
        }

        const currentTime = process.hrtime()[0];

        if (currentTime >= endTime) {
          reject(
            new Error(
              'Assertion for stake requests table failed as response was not received'
                + ` within ${testDuration} mins`,
            ),
          );
        }
      },
      interval);
    }));

    await stakeRequestPromise.then((): void => {
      clearInterval(stakeRequestInterval);
    }).catch((err: Error): Error => {
      clearInterval(stakeRequestInterval);
      throw err;
    });

    let requestStakeInterval: NodeJS.Timeout;

    messageTransferRequest.senderProxy = await stakePoolInstance.methods.stakerProxies(
      messageTransferRequest.sender,
    ).call();

    const requestStakePromise = new Promise(((resolve, reject) => {
      const endTime = Utils.getEndTime(testDuration);
      requestStakeInterval = setInterval(async (): Promise<void> => {
        const stakeRequestDb: MessageTransferRequest | null = await utils.getMessageTransferRequest(
          generatedStakeRequestHash,
        );

        if (stakeRequestDb!.messageHash) {
          (messageHash = stakeRequestDb!.messageHash);
          expectedMessage = new Message(
            messageHash,
            MessageType.Stake,
            MessageDirection.OriginToAuxiliary,
            messageTransferRequest.gateway,
            MessageStatus.Undeclared,
            MessageStatus.Undeclared,
            messageTransferRequest.gasPrice,
            messageTransferRequest.gasLimit,
            messageTransferRequest.nonce,
            messageTransferRequest.senderProxy,
            new BigNumber(0),
            '',
          );
          const messageInDb = await utils.getMessageFromDB(messageHash);

          const gateway: EIP20Gateway = utils.getEIP20GatewayInstance();
          const coGateway: EIP20CoGateway = utils.getEIP20CoGatewayInstance();
          const message = await gateway.methods.messages(messageHash.toString()).call();
          const eip20GatewayMessageStatus = Utils.getEnumValue(
            parseInt(
              await gateway.methods.getOutboxMessageStatus(messageHash).call(),
              10,
            ),
          );

          const eip20CoGatewayMessageStatus = Utils.getEnumValue(
            parseInt(
              await coGateway.methods.getInboxMessageStatus(messageHash).call(),
              10,
            ),
          );
          try {
            if (
              eip20GatewayMessageStatus === MessageStatus.Undeclared
                && eip20CoGatewayMessageStatus === MessageStatus.Undeclared
                && Utils.isSourceUndeclaredTargetUndeclared(messageInDb)
            ) {
              Utils.assertMessages(messageInDb, expectedMessage);
            } else if (
              eip20GatewayMessageStatus === MessageStatus.Declared
                && eip20CoGatewayMessageStatus === MessageStatus.Undeclared
            ) {
              if (Utils.isSourceUndeclaredTargetUndeclared(messageInDb)) {
                Utils.assertMessages(messageInDb, expectedMessage);
              } else {
                expectedMessage.hashLock = message.hashLock;
                Utils.assertMessages(messageInDb, expectedMessage);
                resolve();
              }
            } else {
              throw new Error(
                `Message status for source in db is ${messageInDb.sourceStatus} but in `
                  + `eip20Gateway is ${eip20GatewayMessageStatus} and Message status for target in db is `
                  + `${messageInDb.targetStatus} but got ${eip20CoGatewayMessageStatus}`,
              );
            }
          } catch (e) {
            reject(e);
          }
          const currentTime = process.hrtime()[0];

          if (currentTime >= endTime) {
            reject(
              new Error(
                'Assertion for messages table while request staking failed as response was not received'
                  + ` within ${testDuration} mins`,
              ),
            );
          }
        }
      },
      interval);
    }));

    await requestStakePromise.then((): void => {
      clearInterval(requestStakeInterval);
    }).catch((err: Error): Error => {
      clearInterval(requestStakeInterval);
      throw err;
    });
  });

  it('should verify anchoring', async (): Promise<void> => {
    anchoredBlockNumber = await utils.anchorOrigin();

    let verifyAnchorInterval: NodeJS.Timeout;
    const verifyAnchorPromise = new Promise(((resolve, reject) => {
      const endTime = Utils.getEndTime(testDuration);
      verifyAnchorInterval = setInterval(async (): Promise<void> => {
        const auxiliaryChain: AuxiliaryChain | null = await utils.getAuxiliaryChainFromDb(
          auxChainId,
        );

        if (auxiliaryChain!.lastOriginBlockHeight!.cmp(anchoredBlockNumber) === 0) {
          const expectedAuxiliaryChain = utils.getAuxiliaryChainStub(
            new BigNumber(anchoredBlockNumber),
            auxiliaryChain!.lastAuxiliaryBlockHeight!,
          );
          try {
            Utils.assertAuxiliaryChain(auxiliaryChain!, expectedAuxiliaryChain);
          } catch (e) {
            reject(e);
          }
          resolve();
        }

        const currentTime = process.hrtime()[0];

        if (currentTime >= endTime) {
          reject(
            new Error(
              'Assertion for auxiliary chains table while anchoring failed as'
                + ` response was not received within ${testDuration} mins`,
            ),
          );
        }
      },
      interval);
    }));

    await verifyAnchorPromise.then((): void => {
      clearInterval(verifyAnchorInterval);
    }).catch((err: Error): Error => {
      clearInterval(verifyAnchorInterval);
      throw err;
    });
  });

  it('should verify progress minting', async (): Promise<void> => {
    let progressMintingInterval: NodeJS.Timeout;

    const progressMinting = new Promise(((resolve, reject) => {
      const endTime = Utils.getEndTime(testDuration * 2);
      progressMintingInterval = setInterval(async (): Promise<void> => {
        const eip20CoGateway = utils.getEIP20CoGatewayInstance();

        const eip20CoGatewayMessageStatus = Utils.getEnumValue(parseInt(
          await eip20CoGateway.methods.getInboxMessageStatus(
            messageHash!,
          ).call(),
          10,
        ));

        const eip20Gateway = utils.getEIP20GatewayInstance();
        const eip20GatewayMessageStatus = Utils.getEnumValue(parseInt(
          await eip20Gateway.methods.getOutboxMessageStatus(
            messageHash!,
          ).call(),
          10,
        ));

        const messageInGateway = await eip20Gateway.methods.messages(messageHash!).call();

        const messageInDb = await utils.getMessageFromDB(messageHash);

        expectedMessage = Utils.getMessageStub(messageInGateway, expectedMessage!);
        try {
          if (Utils.isMessageStatusValid(
            eip20GatewayMessageStatus,
            eip20CoGatewayMessageStatus,
            messageInDb,
          )) {
            Utils.assertMessages(messageInDb, expectedMessage);
          } else if (
            eip20GatewayMessageStatus === MessageStatus.Progressed
              && eip20CoGatewayMessageStatus === MessageStatus.Progressed
              && Utils.isSourceProgressedTargetProgressed(messageInDb)
          ) {
            Utils.assertMessages(messageInDb, expectedMessage);
            const reward = messageTransferRequest.gasPrice.mul(messageTransferRequest.gasLimit);
            const expectedMintedAmount: BigNumber = messageTransferRequest.amount.sub(reward);
            const actualMintedAmount: BigNumber = await helperObject.getMintedBalance(messageTransferRequest.beneficiary);
            assert.strictEqual(
              actualMintedAmount.cmp(expectedMintedAmount),
              0,
              `Expected minted balance is ${expectedMintedAmount} but got ${actualMintedAmount}`,
            );
            resolve();
          } else {
            throw new Error(
              `Message status for source in db is ${messageInDb.sourceStatus} but in `
                + `eip20Gateway is ${eip20GatewayMessageStatus} and Message status for target in db is `
                + `${messageInDb.targetStatus} but got ${eip20CoGatewayMessageStatus}`,
            );
          }
        } catch (e) {
          reject(e);
        }

        const currentTime = process.hrtime()[0];
        if (currentTime >= endTime) {
          reject(
            new Error(
              'Time out while verifying progress minting of message. Source status at db is'
                + `${messageInDb.sourceStatus} and Target status at db is ${messageInDb.targetStatus}`
                + `EIP20Gateway status is ${eip20GatewayMessageStatus} and EIP20CoGateway status is`
                + `${eip20CoGatewayMessageStatus}`,
            ),
          );
        }
      },
      interval);
    }));

    await progressMinting.then((): void => {
      clearInterval(progressMintingInterval);
    }).catch((err: Error): Error => {
      clearInterval(progressMintingInterval);
      throw err;
    });
  });
});
