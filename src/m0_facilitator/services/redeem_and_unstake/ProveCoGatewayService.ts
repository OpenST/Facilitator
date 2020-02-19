// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------


/* eslint-disable import/no-unresolved */

import assert from 'assert';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';

import { interacts } from '@openst/mosaic-contracts';
import { ProofGenerator } from '@openst/mosaic-proof';

import { EIP20Gateway } from '@openst/mosaic-contracts/dist/interacts/EIP20Gateway';
import { ORIGIN_GAS_PRICE } from '../../Constants';
import Logger from '../../Logger';
import AuxiliaryChain from '../../models/AuxiliaryChain';
import Observer from '../../observer/Observer';
import GatewayRepository from '../../repositories/GatewayRepository';
import { MessageDirection, MessageRepository } from '../../repositories/MessageRepository';
import Utils from '../../Utils';

export default class ProveCoGatewayService extends Observer<AuxiliaryChain> {
  private gatewayRepository: GatewayRepository;

  private messageRepository: MessageRepository;

  private originWeb3: Web3;

  private auxiliaryWeb3: Web3;

  private originWorkerAddress: string;

  private coGatewayAddress: string;

  private auxiliaryChainId: number;

  /**
   *  Constructor
   *
   * @param gatewayRepository Instance of gateway repository.
   * @param messageRepository Instance of message repository.
   * @param originWeb3 Origin Web3 instance.
   * @param auxiliaryWeb3 Auxiliary Web3 instance.
   * @param originWorkerAddress auxiliary worker address, this should be
   *                               unlocked and added in web3 wallet.
   * @param coGatewayAddress Address of coGateway contract on aux chain.
   * @param auxiliaryChainId Auxiliary chain Id.
   */
  public constructor(
    gatewayRepository: GatewayRepository,
    messageRepository: MessageRepository,
    originWeb3: Web3,
    auxiliaryWeb3: Web3,
    originWorkerAddress: string,
    coGatewayAddress: string,
    auxiliaryChainId: number,
  ) {
    super();

    this.gatewayRepository = gatewayRepository;
    this.originWeb3 = originWeb3;
    this.auxiliaryWeb3 = auxiliaryWeb3;
    this.originWorkerAddress = originWorkerAddress;
    this.coGatewayAddress = coGatewayAddress;
    this.messageRepository = messageRepository;
    this.auxiliaryChainId = auxiliaryChainId;
  }

  /**
   * This method react on changes in auxiliary chain models.
   * @param auxiliaryChains List of auxiliary chains model
   */
  public async update(auxiliaryChains: AuxiliaryChain[]): Promise<void> {
    const interestedAuxiliaryChainRecord = auxiliaryChains
      .filter((auxiliaryChain): boolean => auxiliaryChain.chainId === this.auxiliaryChainId
        && auxiliaryChain.lastAuxiliaryBlockHeight !== undefined);

    assert(
      interestedAuxiliaryChainRecord.length <= 1,
      'interestedAuxiliaryChainRecord length should be less or equal to 1',
    );

    if (interestedAuxiliaryChainRecord.length === 1) {
      await this.proveCoGateway(
        interestedAuxiliaryChainRecord[0].lastAuxiliaryBlockHeight!,
      );
    }
  }

  /**
   * This method performs prove gateway transaction on origin chain.
   * This throws error if gateway details doesn't exist.
   *
   * @param blockHeight Block height at which anchor state root happens.
   *
   * @return Return a promise that resolves to object which tell about success or failure.
   */
  private async proveCoGateway(
    blockHeight: BigNumber,
  ): Promise<{ transactionHash: string; message: string}> {
    const gatewayRecord = await this.gatewayRepository.get(this.coGatewayAddress);
    if (gatewayRecord === null) {
      return Promise.reject(new Error('Gateway record does not exist for given gateway'));
    }
    const pendingMessages = await this.messageRepository.getMessagesForConfirmation(
      this.coGatewayAddress,
      blockHeight,
      MessageDirection.AuxiliaryToOrigin,
    );
    Logger.debug(`Total pending message ${pendingMessages.length}`);
    if (pendingMessages.length === 0) {
      Logger.info(
        `There are no pending messages for gateway ${this.coGatewayAddress}.`
        + ' Hence skipping proveGateway',
      );
      return Promise.resolve(
        {
          transactionHash: '',
          message: 'There are no pending messages for this gateway.',
        },
      );
    }
    const gateway = gatewayRecord.remoteGatewayAddress;

    Logger.info(`Generating proof for gateway address ${this.coGatewayAddress} at blockHeight ${blockHeight.toString()}`);
    const proofGenerator = new ProofGenerator(this.auxiliaryWeb3);
    const {
      encodedAccountValue,
      serializedAccountProof,
    } = await proofGenerator.getOutboxProof(
      this.coGatewayAddress,
      [],
      blockHeight.toString(10),
    );
    Logger.info(`Proof generated encodedAccountValue ${encodedAccountValue} and serializedAccountProof ${serializedAccountProof} `);
    assert(encodedAccountValue !== undefined);
    assert(serializedAccountProof !== undefined);
    const transactionHash = await this.prove(
      gateway,
      blockHeight,
      encodedAccountValue as string,
      serializedAccountProof as string,
    );

    Logger.info(`Prove gateway transaction hash ${transactionHash}`);
    return { transactionHash, message: 'Gateway successfully proven' };
  }

  /**
   * This is a private method which uses mosaic.js to make proveGateway transaction.
   *
   * @param gatewayAddress  Gateway address in origin chain.
   * @param lastOriginBlockHeight Block height at which latest state root is anchored.
   * @param encodedAccountValue RPL encoded value of gateway account.
   * @param serializedAccountProof RLP encoded value of account proof.
   *
   * @return Return a promise that resolves to receipt.
   */
  private async prove(
    gatewayAddress: string,
    lastOriginBlockHeight: BigNumber,
    encodedAccountValue: string,
    serializedAccountProof: string,
  ): Promise<string> {
    const eip20Gateway: EIP20Gateway = interacts.getEIP20Gateway(
      this.originWeb3,
      gatewayAddress,
    );

    const transactionOptions = {
      from: this.originWorkerAddress,
      gasPrice: ORIGIN_GAS_PRICE,
    };

    const rawTx = eip20Gateway.methods.proveGateway(
      lastOriginBlockHeight.toString(10),
      encodedAccountValue as any,
      serializedAccountProof as any,
    );

    return Utils.sendTransaction(
      rawTx,
      transactionOptions,
      this.originWeb3,
    );
  }
}
