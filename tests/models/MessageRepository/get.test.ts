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

import 'mocha';

import {
  MessageAttributes,
  Message,
} from '../../../src/models/MessageRepository';
import Database from '../../../src/models/Database';

import Util from './util';

import assert = require('assert');

interface TestConfigInterface {
  db: Database;
}
let config: TestConfigInterface;

describe('MessageRepository::get', (): void => {
  beforeEach(async (): Promise<void> => {
    config = {
      db: await Database.create(),
    };
  });

  it('Checks retrieval of an existing auxiliary chain.', async (): Promise<void> => {
    const messageAttributes: MessageAttributes = {
      messageHash: '0x497A49648885f7aaC3d761817F191ee1AFAF399CFHKHFKDHKSDK343DDFDFD',
      type: 'redeemAndUnstake',
      gatewayAddress: '0x477A49648885f7aaC3d761817F191ee1AFAF399C',
      sourceStatus: 'Declared',
      targetStatus: 'Progressed',
      gasPrice: 1,
      gasLimit: 1,
      nonce: 2,
      sender: '0x397B49648885f7aaC3d761817F191ee1AFAF399C',
      direction: 'a2o',
      sourceDeclarationBlockHeight: 2,
    };

    await config.db.messageRepository.create(
      messageAttributes,
    );

    const message = await config.db.messageRepository.get(
      messageAttributes.messageHash,
    );

    assert.notStrictEqual(
      message,
      null,
      'Auxiliary chain should exist as it has been just created.',
    );

    Util.checkMessageAgainstAttributes(
      message as Message,
      messageAttributes,
    );
  });

  it('Checks retrieval of non-existing chain.', async (): Promise<void> => {
    const nonExistingMessageHash = 'nonExistingMessageHash';
    const message = await config.db.messageRepository.get(
      nonExistingMessageHash,
    );

    assert.strictEqual(
      message,
      null,
      'Message  with \'nonExistingMessageHash\' does not exist.',
    );
  });
});
