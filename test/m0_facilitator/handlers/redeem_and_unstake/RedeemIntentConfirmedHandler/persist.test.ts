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
import * as utils from 'web3-utils';

import RedeemntentConfirmedHandler from '../../../../../src/m0_facilitator/handlers/redeem_and_unstake/RedeemIntentConfirmedHandler';
import Message from '../../../../../src/m0_facilitator/models/Message';
import {
  MessageDirection, MessageRepository, MessageStatus, MessageType,
} from '../../../../../src/m0_facilitator/repositories/MessageRepository';
import assert from '../../../../test_utils/assert';
import SpyAssert from '../../../../test_utils/SpyAssert';
import StubData from '../../../../test_utils/StubData';

describe('RedeemIntentConfirmedHandler.persist()', (): void => {
  let transactions: any = [];
  let saveStub: any;
  let existingMessageRecord: Message;
  let outputMessage: Message;
  let sinonMessageRepositoryMock: any;
  const type: MessageType = MessageType.Redeem;
  const direction: MessageDirection = MessageDirection.AuxiliaryToOrigin;
  beforeEach(async () => {
    transactions = [{
      id: '1',
      _messageHash: '0x000000000000000000000000000000000000000000000000000001',
      _redeemer: '0x0000000000000000000000000000000000000002',
      _redeemerNonce: '1',
      _beneficiary: '0x0000000000000000000000000000000000000003',
      _amount: 100,
      _blockHeight: 1234,
      _hashLock: '1',
      contractAddress: '0x0000000000000000000000000000000000000001',
    }];
    saveStub = sinon.stub();
    existingMessageRecord = StubData.messageAttributes(
      transactions[0]._messageHash,
      transactions[0].contractAddress,
      new BigNumber('1'),
    );
    existingMessageRecord.type = type;
    existingMessageRecord.direction = direction;

    sinonMessageRepositoryMock = sinon.createStubInstance(MessageRepository, {
      save: Promise.resolve(saveStub),
      get: Promise.resolve(existingMessageRecord),
    });

    outputMessage = StubData.messageAttributes(
      transactions[0]._messageHash,
      transactions[0].contractAddress,
      new BigNumber('1'),
    );
    outputMessage.targetStatus = MessageStatus.Declared;
    outputMessage.type = type;
    outputMessage.direction = direction;
  });

  it('should persist successfully when target status is undeclared', async (): Promise<void> => {
    existingMessageRecord.targetStatus = MessageStatus.Undeclared;

    const handler = new RedeemntentConfirmedHandler(sinonMessageRepositoryMock);
    const models = await handler.persist(transactions);

    assert.equal(
      models.length,
      transactions.length,
      'Number of models must be equal to transactions',
    );

    assert.deepStrictEqual(models[0], outputMessage);
    SpyAssert.assert(sinonMessageRepositoryMock.save, 1, [[outputMessage]]);
  });

  it('should persist successfully when target status is undefined', async (): Promise<void> => {
    existingMessageRecord.targetStatus = undefined as unknown as MessageStatus;

    const handler = new RedeemntentConfirmedHandler(sinonMessageRepositoryMock);

    const models = await handler.persist(transactions);

    assert.equal(
      models.length,
      transactions.length,
      'Number of models must be equal to transactions',
    );

    assert.deepStrictEqual(models[0], outputMessage);
    SpyAssert.assert(sinonMessageRepositoryMock.save, 1, [[outputMessage]]);
  });

  it('should create new entry when message is not present', async (): Promise<void> => {
    const save = sinon.stub();

    const mockMessageRepo = sinon.createStubInstance(MessageRepository, {
      save: Promise.resolve(save as any),
      get: Promise.resolve(null),
    });
    const handler = new RedeemntentConfirmedHandler(mockMessageRepo as any);

    const models = await handler.persist(transactions);

    const outputMessage = new Message(
      transactions[0]._messageHash,
      type,
      direction,
      transactions[0].contractAddress,
      undefined,
      MessageStatus.Declared,
      undefined,
      undefined,
      new BigNumber(transactions[0]._redeemerNonce),
      utils.toChecksumAddress(transactions[0]._redeemer),
      undefined,
      undefined,
      transactions[0]._hashLock,
      undefined,
      undefined,
    );

    assert.equal(
      models.length,
      transactions.length,
      'Number of models must be equal to transaction',
    );

    assert.deepStrictEqual(models[0], outputMessage);
    SpyAssert.assert(mockMessageRepo.save, 1, [[outputMessage]]);
  });

  it('should not change message record if message target status is not Undeclared',
    async (): Promise<void> => {
      existingMessageRecord.targetStatus = MessageStatus.RevocationDeclared;

      const handler = new RedeemntentConfirmedHandler(sinonMessageRepositoryMock);

      const models = await handler.persist(transactions);

      assert.equal(
        models.length,
        transactions.length,
        'Number of models must be equal to transactions',
      );
      outputMessage.targetStatus = existingMessageRecord.targetStatus;
      assert.deepStrictEqual(models[0], outputMessage);
      SpyAssert.assert(sinonMessageRepositoryMock.save, 1, [[outputMessage]]);
    });
});
