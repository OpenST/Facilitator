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


import BigNumber from 'bignumber.js';
import sinon from 'sinon';
import * as Web3Utils from 'web3-utils';

import StakeIntentDeclaredHandler from '../../../../../src/m0_facilitator/handlers/stake_and_mint/StakeIntentDeclaredHandler';
import Message from '../../../../../src/m0_facilitator/models/Message';
import {
  MessageDirection, MessageRepository, MessageStatus, MessageType,
} from '../../../../../src/m0_facilitator/repositories/MessageRepository';
import assert from '../../../../test_utils/assert';
import SpyAssert from '../../../../test_utils/SpyAssert';
import StubData from '../../../../test_utils/StubData';
import {
  default as MessageTransferRequestRepository,
  RequestType,
} from '../../../../../src/m0_facilitator/repositories/MessageTransferRequestRepository';

describe('StakeIntentDeclaredHandler.persist()', (): void => {
  const transactions = [{
    _messageHash: Web3Utils.keccak256('1'),
    _staker: '0x0000000000000000000000000000000000000001',
    _stakerNonce: '1',
    _beneficiary: '0x0000000000000000000000000000000000000002',
    _amount: '100',
    contractAddress: '0x0000000000000000000000000000000000000002',
    blockNumber: '10',
  }];
  const stakeRequest = StubData.getAMessageTransferRequest(
    'requestHash',
    RequestType.Stake,
  );
  const saveMessageTransferRequest = sinon.stub();
  let mockedMessageTransferRequestRepository = sinon.createStubInstance(
    MessageTransferRequestRepository,
    {
      getBySenderProxyNonce: Promise.resolve(stakeRequest),
      save: saveMessageTransferRequest as any,
    },
  );

  afterEach((): void => {
    sinon.restore();
  });

  it('should change message source state to Declared if message does not exist',
    async (): Promise<void> => {
      const save = sinon.stub();

      const mockedMessageRepository = sinon.createStubInstance(MessageRepository,
        {
          save: save as any,
          get: Promise.resolve(null),
        });
      const handler = new StakeIntentDeclaredHandler(
        mockedMessageRepository as any,
        mockedMessageTransferRequestRepository as any,
      );

      const models = await handler.persist(transactions);

      const expectedModel = new Message(
        transactions[0]._messageHash,
        MessageType.Stake,
        MessageDirection.OriginToAuxiliary,
      );
      expectedModel.sender = transactions[0]._staker;
      expectedModel.nonce = new BigNumber(transactions[0]._stakerNonce);
      expectedModel.sourceStatus = MessageStatus.Declared;
      expectedModel.gatewayAddress = transactions[0].contractAddress;
      expectedModel.sourceDeclarationBlockHeight = new BigNumber(transactions[0].blockNumber);

      assert.equal(
        models.length,
        transactions.length,
        'Number of models must be equal to transactions',
      );
      SpyAssert.assert(save, 1, [[expectedModel]]);
      SpyAssert.assert(mockedMessageRepository.get, 1, [[transactions[0]._messageHash]]);
      SpyAssert.assert(
        mockedMessageTransferRequestRepository.getBySenderProxyNonce,
        1,
        [[transactions[0]._staker, new BigNumber(transactions[0]._stakerNonce)]],
      );
    });

  it('should change message source state to Declared if message status is Undeclared',
    async (): Promise<void> => {
      const save = sinon.stub();

      const existingMessageWithUndeclaredStatus = new Message(
        Web3Utils.keccak256('1'),
        MessageType.Stake,
        MessageDirection.OriginToAuxiliary,
      );
      existingMessageWithUndeclaredStatus.sourceStatus = MessageStatus.Undeclared;
      const mockedMessageRepository = sinon.createStubInstance(MessageRepository,
        {
          save: save as any,
          get: Promise.resolve(existingMessageWithUndeclaredStatus),
        });
      const handler = new StakeIntentDeclaredHandler(
        mockedMessageRepository as any,
        mockedMessageTransferRequestRepository as any,
      );

      const models = await handler.persist(transactions);

      const expectedModel = new Message(
        transactions[0]._messageHash,
        MessageType.Stake,
        MessageDirection.OriginToAuxiliary,
      );
      expectedModel.sourceStatus = MessageStatus.Declared;
      expectedModel.sourceDeclarationBlockHeight = new BigNumber(transactions[0].blockNumber);

      assert.equal(
        models.length,
        transactions.length,
        'Number of models must be equal to transactions',
      );
      SpyAssert.assert(save, 1, [[expectedModel]]);
      SpyAssert.assert(
        mockedMessageRepository.get,
        1,
        [[transactions[0]._messageHash]],
      );
    });

  it('should not change message source state to Declared if current status is Progressed',
    async (): Promise<void> => {
      const save = sinon.stub();

      const existingMessageWithProgressStatus = new Message(
        Web3Utils.keccak256('1'),
        MessageType.Stake,
        MessageDirection.OriginToAuxiliary,
      );
      existingMessageWithProgressStatus.sourceStatus = MessageStatus.Progressed;
      const mockedMessageRepository = sinon.createStubInstance(MessageRepository,
        {
          save: save as any,
          get: Promise.resolve(existingMessageWithProgressStatus),
        });
      const handler = new StakeIntentDeclaredHandler(
        mockedMessageRepository as any,
        mockedMessageTransferRequestRepository as any,
      );

      const models = await handler.persist(transactions);

      const expectedModel = new Message(
        transactions[0]._messageHash,
        MessageType.Stake,
        MessageDirection.OriginToAuxiliary,
      );
      expectedModel.sourceStatus = MessageStatus.Progressed;

      assert.equal(
        models.length,
        transactions.length,
        'Number of models must be equal to transactions',
      );
      SpyAssert.assert(save, 1, [[expectedModel]]);
      SpyAssert.assert(
        mockedMessageRepository.get,
        1,
        [[transactions[0]._messageHash]],
      );
    });

  it('should not change message state if current status is already Declared',
    async (): Promise<void> => {
      const save = sinon.stub();

      const existingMessageWithProgressStatus = new Message(
        Web3Utils.keccak256('1'),
        MessageType.Stake,
        MessageDirection.OriginToAuxiliary,
      );
      existingMessageWithProgressStatus.sourceStatus = MessageStatus.Declared;
      const mockedMessageRepository = sinon.createStubInstance(MessageRepository,
        {
          save: save as any,
          get: Promise.resolve(existingMessageWithProgressStatus),
        });
      const handler = new StakeIntentDeclaredHandler(
        mockedMessageRepository as any,
        mockedMessageTransferRequestRepository as any,
      );

      const models = await handler.persist(transactions);

      const expectedModel = new Message(
        transactions[0]._messageHash,
        MessageType.Stake,
        MessageDirection.OriginToAuxiliary,
      );
      expectedModel.sourceStatus = MessageStatus.Declared;

      assert.equal(
        models.length,
        transactions.length,
        'Number of models must be equal to transactions',
      );
      SpyAssert.assert(save, 1, [[expectedModel]]);
      SpyAssert.assert(
        mockedMessageRepository.get,
        1,
        [[transactions[0]._messageHash]],
      );
    });

  it('should update messageHash in messageTransferRequestRepository',
    async (): Promise<void> => {
      const messageSave = sinon.stub();
      const mockedMessageRepository = sinon.createStubInstance(MessageRepository,
        {
          save: messageSave as any,
          get: Promise.resolve(null),
        });

      // Sync stakeRequest with message model
      stakeRequest.senderProxy = transactions[0]._staker;
      stakeRequest.nonce = new BigNumber(transactions[0]._stakerNonce);
      stakeRequest.messageHash = null;
      const stakeRequestSave = sinon.stub();
      mockedMessageTransferRequestRepository = sinon.createStubInstance(
        MessageTransferRequestRepository,
        {
          getBySenderProxyNonce: Promise.resolve(stakeRequest),
          save: stakeRequestSave as any,
        },
      );

      const handler = new StakeIntentDeclaredHandler(
        mockedMessageRepository as any,
        mockedMessageTransferRequestRepository as any,
      );

      const messageModels = await handler.persist(transactions);

      const expectedMessageModel = new Message(
        transactions[0]._messageHash,
        MessageType.Stake,
        MessageDirection.OriginToAuxiliary,
      );
      expectedMessageModel.sender = transactions[0]._staker;
      expectedMessageModel.nonce = new BigNumber(transactions[0]._stakerNonce);
      expectedMessageModel.sourceStatus = MessageStatus.Declared;
      expectedMessageModel.gatewayAddress = transactions[0].contractAddress;
      expectedMessageModel.sourceDeclarationBlockHeight = new BigNumber(
        transactions[0].blockNumber,
      );

      // Validate message models
      assert.equal(
        messageModels.length,
        transactions.length,
        'Number of models must be equal to transactions',
      );
      SpyAssert.assert(mockedMessageRepository.get, 1, [[transactions[0]._messageHash]]);
      SpyAssert.assert(messageSave, 1, [[expectedMessageModel]]);

      // Validate stakeRequest models
      stakeRequest.messageHash = expectedMessageModel.messageHash;
      SpyAssert.assert(
        mockedMessageTransferRequestRepository.getBySenderProxyNonce,
        1,
        [[transactions[0]._staker, new BigNumber(transactions[0]._stakerNonce)]],
      );
      SpyAssert.assert(stakeRequestSave, 1, [[stakeRequest]]);
    });

  it('should not update messageHash in messageTransferRequestRepository when stakeRequest is'
    + ' undefined',
  async (): Promise<void> => {
    const messageSave = sinon.stub();
    const mockedMessageRepository = sinon.createStubInstance(MessageRepository,
      {
        save: messageSave as any,
        get: Promise.resolve(null),
      });

    const stakeRequestSave = sinon.stub();
    mockedMessageTransferRequestRepository = sinon.createStubInstance(
      MessageTransferRequestRepository,
      {
        getBySenderProxyNonce: Promise.resolve(null),
        save: stakeRequestSave as any,
      },
    );

    const handler = new StakeIntentDeclaredHandler(
      mockedMessageRepository as any,
      mockedMessageTransferRequestRepository as any,
    );
    await handler.persist(transactions);

    SpyAssert.assert(
      mockedMessageTransferRequestRepository.getBySenderProxyNonce,
      1,
      [[transactions[0]._staker, new BigNumber(transactions[0]._stakerNonce)]],
    );
    SpyAssert.assert(stakeRequestSave, 0, [[]]);
  });
});
