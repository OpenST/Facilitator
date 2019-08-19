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

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import 'mocha';

import BigNumber from 'bignumber.js';
import sinon from 'sinon';
import Web3 from 'web3';

import { interacts } from '@openst/mosaic-contracts';

import { ORIGIN_GAS_PRICE } from '../../../src/Constants';
import Message from '../../../src/models/Message';
import StakeRequest from '../../../src/models/StakeRequest';
import {
  MessageDirection, MessageStatus, MessageType,
} from '../../../src/repositories/MessageRepository';
import Repositories from '../../../src/repositories/Repositories';
import AcceptStakeRequestService from '../../../src/services/AcceptStakeRequestService';
import Utils from '../../../src/Utils';
import assert from '../../test_utils/assert';
import SpyAssert from '../../test_utils/SpyAssert';

interface TestConfigInterface {
  web3: Web3;
  repos: Repositories;
  stakeRequestWithMessageHashB: StakeRequest;
  stakeRequestWithNullMessageHashC: StakeRequest;
  service: AcceptStakeRequestService;
  fakeData: {
    secret: string;
    hashLock: string;
    messageHash: string;
  };
}
let config: TestConfigInterface;

describe('AcceptStakeRequestService::update', (): void => {
  const web3 = new Web3(null);
  let acceptStakeRequestSpy: any;
  let interactsSpy: any;
  const ostComposerAddress = '0x0000000000000000000000000000000000000001';
  const originWorkerAddress = '0x0000000000000000000000000000000000000002';
  let sendTransactionSpy: any;
  const fakeTransactionHash = 'fakeTransactionHash';

  beforeEach(async (): Promise<void> => {
    const repos = await Repositories.create();
    const service = new AcceptStakeRequestService(
      repos,
      web3,
      ostComposerAddress,
      originWorkerAddress,
    );
    config = {
      web3,
      repos,
      stakeRequestWithMessageHashB: new StakeRequest(
        'stakeRequestHashB',
        new BigNumber('11'),
        '0x0000000000000000000000000000000000000001',
        new BigNumber('12'),
        new BigNumber('13'),
        new BigNumber('14'),
        '0x0000000000000000000000000000000000000002',
        '0x0000000000000000000000000000000000000003',
        '0x0000000000000000000000000000000000000004',
        'messageHashB',
      ),
      stakeRequestWithNullMessageHashC: new StakeRequest(
        'stakeRequestHashC',
        new BigNumber('21'),
        '0x0000000000000000000000000000000000000011',
        new BigNumber('22'),
        new BigNumber('23'),
        new BigNumber('24'),
        '0x0000000000000000000000000000000000000012',
        '0x0000000000000000000000000000000000000013',
        '0x0000000000000000000000000000000000000014',
      ),
      service,
      fakeData: {
        secret: '0x1d5b16860e7306df9e2d3ee077d6f3e3c4a4b5b22d2ae6d5adfee6a2147f529c',
        hashLock: '0xa36e17d0a9b4240af1deff571017e108d2c1a40de02d84f419113b1e1f7ad40f',
        messageHash: '0x0f19c82aafa8d2c9c28b9ae3588422b65b32b8c7c43a54cd857cab6ef527fd45',
      },
    };

    sinon.stub(AcceptStakeRequestService, 'generateSecret').returns({
      secret: config.fakeData.secret,
      hashLock: config.fakeData.hashLock,
    });

    const message = new Message(
      config.stakeRequestWithMessageHashB.messageHash as string,
      MessageType.Stake,
      '0x0000000000000000000000000000000000000001',
      MessageStatus.Declared,
      MessageStatus.Undeclared,
      new BigNumber('1'),
      new BigNumber('1'),
      new BigNumber('1'),
      '0x0000000000000000000000000000000000000002',
      MessageDirection.OriginToAuxiliary,
      new BigNumber('1'),
      '0x00000000000000000000000000000000000000000000000000000000000000001',
      '0x00000000000000000000000000000000000000000000000000000000000000002',
      new Date(),
      new Date(),
    );

    await config.repos.messageRepository.save(
      message,
    );

    await config.repos.stakeRequestRepository.save(
      config.stakeRequestWithMessageHashB,
    );

    await config.repos.stakeRequestRepository.save(
      config.stakeRequestWithNullMessageHashC,
    );

    const someFakeOSTComposerInstance = {
      methods: {
        acceptStakeRequest: () => {},
      },
    };

    const someFakeGatewayInstance = {
      methods: {
        bounty: () => ({
          call: () => '1',
        }),
        baseToken: () => ({
          call: () => '123',
        }),
      },
    };

    const someFakeEIP20Token = {
      methods: {
        approve: () => fakeTransactionHash,
      },
    };

    acceptStakeRequestSpy = sinon.replace(
      someFakeOSTComposerInstance.methods,
      'acceptStakeRequest',
      sinon.fake.returns(fakeTransactionHash),
    );

    interactsSpy = sinon.replace(
      interacts,
      'getOSTComposer',
      sinon.fake.returns(someFakeOSTComposerInstance),
    );

    sinon.replace(
      interacts,
      'getEIP20Gateway',
      sinon.fake.returns(someFakeGatewayInstance),
    );

    sinon.replace(
      interacts,
      'getEIP20Token',
      sinon.fake.returns(someFakeEIP20Token),
    );
    sendTransactionSpy = sinon.replace(
      Utils,
      'sendTransaction',
      sinon.fake.resolves(fakeTransactionHash),
    );
  });

  afterEach(async (): Promise<void> => {
    sinon.restore();
  });

  it('Checks that the stake request repository properly updated.', async (): Promise<void> => {
    const stakeRequests = [
      config.stakeRequestWithMessageHashB,
      config.stakeRequestWithNullMessageHashC,
    ];

    await config.service.update(stakeRequests);

    const stakeRequestC = await config.repos.stakeRequestRepository.get(
      config.stakeRequestWithNullMessageHashC.stakeRequestHash,
    ) as StakeRequest;

    const messageC = await config.repos.messageRepository.get(
      config.fakeData.messageHash,
    ) as Message;

    assert.notStrictEqual(
      stakeRequestC,
      null,
      'Stake request exists in repository.',
    );

    // Here we check against pre-calculated message hash (using fake data).
    // This is a sanity check. It would fail if there is a semantic change
    // in hash calculation. This should not happen in general. However,
    // if it's intended, the message hash calculation in corresponding contract
    // should be updated also. This catch (sync between message hash calculations
    // in js and contract layer) is going to be taken care by integration test.
    assert.strictEqual(
      stakeRequestC.messageHash,
      config.fakeData.messageHash,
    );
    SpyAssert.assert(
      interactsSpy,
      1,
      [[web3, ostComposerAddress]],
    );
    SpyAssert.assert(
      acceptStakeRequestSpy,
      1,
      [[
        stakeRequestC.amount!.toString(10),
        stakeRequestC.beneficiary!,
        stakeRequestC.gasPrice!.toString(10),
        stakeRequestC.gasLimit!.toString(10),
        stakeRequestC.nonce!.toString(10),
        stakeRequestC.staker!,
        stakeRequestC.gateway!,
        messageC.hashLock,
      ]],
    );
    SpyAssert.assert(
      sendTransactionSpy,
      2,
      [
        [fakeTransactionHash, {
          from: originWorkerAddress,
          gasPrice: ORIGIN_GAS_PRICE,
        }, web3],
        [fakeTransactionHash, {
          from: originWorkerAddress,
          gasPrice: ORIGIN_GAS_PRICE,
        }, web3],
      ],
    );
  });

  it('Checks that the message repository is properly updated.', async (): Promise<void> => {
    const stakeRequests = [
      config.stakeRequestWithMessageHashB,
      config.stakeRequestWithNullMessageHashC,
    ];

    await config.service.update(stakeRequests);

    const messageC = await config.repos.messageRepository.get(
      config.fakeData.messageHash,
    ) as Message;

    const stakeRequestC = await config.repos.stakeRequestRepository.get(
      config.stakeRequestWithNullMessageHashC.stakeRequestHash,
    ) as StakeRequest;

    assert.notStrictEqual(
      messageC,
      null,
      'Message exists in the repository.',
    );

    assert.strictEqual(
      messageC.type,
      MessageType.Stake,
    );

    assert.strictEqual(
      messageC.gatewayAddress,
      config.stakeRequestWithNullMessageHashC.gateway,
    );

    assert.strictEqual(
      messageC.sourceStatus,
      MessageStatus.Undeclared,
    );

    assert.strictEqual(
      messageC.targetStatus,
      MessageStatus.Undeclared,
    );

    assert.strictEqual(
      messageC.gasPrice!.comparedTo(config.stakeRequestWithNullMessageHashC.gasPrice as BigNumber),
      0,
    );

    assert.strictEqual(
      messageC.gasLimit!.comparedTo(config.stakeRequestWithNullMessageHashC.gasLimit as BigNumber),
      0,
    );

    assert.strictEqual(
      messageC.nonce!.comparedTo(config.stakeRequestWithNullMessageHashC.nonce as BigNumber),
      0,
    );

    assert.strictEqual(
      messageC.sender,
      config.stakeRequestWithNullMessageHashC.stakerProxy,
    );

    assert.strictEqual(
      messageC.direction,
      MessageDirection.OriginToAuxiliary,
    );

    assert.strictEqual(
      messageC.sourceDeclarationBlockHeight!.comparedTo(0),
      0,
    );

    assert.strictEqual(
      messageC.secret,
      config.fakeData.secret,
    );

    assert.strictEqual(
      messageC.hashLock,
      config.fakeData.hashLock,
    );
    SpyAssert.assert(
      interactsSpy,
      1,
      [[web3, ostComposerAddress]],
    );
    SpyAssert.assert(
      acceptStakeRequestSpy,
      1,
      [[
        stakeRequestC.amount!.toString(10),
        stakeRequestC.beneficiary!,
        stakeRequestC.gasPrice!.toString(10),
        stakeRequestC.gasLimit!.toString(10),
        stakeRequestC.nonce!.toString(10),
        stakeRequestC.staker!,
        stakeRequestC.gateway!,
        messageC.hashLock,
      ]],
    );
    SpyAssert.assert(
      sendTransactionSpy,
      2,
      [
        [fakeTransactionHash, {
          from: originWorkerAddress,
          gasPrice: ORIGIN_GAS_PRICE,
        }, web3],

        [fakeTransactionHash, {
          from: originWorkerAddress,
          gasPrice: ORIGIN_GAS_PRICE,
        }, web3],
      ],
    );
  });
});
