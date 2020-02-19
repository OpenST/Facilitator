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

import MessageTransferRequest from '../../../../src/m0_facilitator/models/MessageTransferRequest';
import assert from '../../../test_utils/assert';

const Util = {
  checkInputAgainstOutput(
    requestInput: MessageTransferRequest,
    requestOutput: MessageTransferRequest,
  ): void {
    if (requestInput.requestHash !== undefined) {
      assert.strictEqual(
        requestInput.requestHash,
        requestOutput.requestHash,
      );
    }

    if (requestInput.amount !== undefined) {
      assert.isOk(
        requestInput.amount.comparedTo(requestOutput.amount) === 0,
      );
    }

    if (requestInput.beneficiary !== undefined) {
      assert.strictEqual(
        requestInput.beneficiary,
        requestOutput.beneficiary,
      );
    }

    if (requestInput.gasPrice !== undefined) {
      assert.isOk(
        requestInput.gasPrice.comparedTo(requestOutput.gasPrice) === 0,
      );
    }

    if (requestInput.gasLimit !== undefined) {
      assert.isOk(
        requestInput.gasLimit.comparedTo(requestOutput.gasLimit) === 0,
      );
    }

    if (requestInput.nonce !== undefined) {
      assert.isOk(
        requestInput.nonce.comparedTo(requestOutput.nonce) === 0,
      );
    }

    if (requestInput.gateway !== undefined) {
      assert.strictEqual(
        requestInput.gateway,
        requestOutput.gateway,
      );
    }

    if (requestInput.sender !== undefined) {
      assert.strictEqual(
        requestInput.sender,
        requestOutput.sender,
      );
    }

    if (requestInput.senderProxy !== undefined) {
      assert.strictEqual(
        requestInput.senderProxy,
        requestOutput.senderProxy,
      );
    }

    if (requestInput.messageHash !== undefined) {
      assert.strictEqual(
        requestInput.messageHash,
        requestOutput.messageHash,
      );
    }

    if (requestInput.blockNumber !== undefined) {
      assert.deepStrictEqual(
        requestInput.blockNumber,
        requestOutput.blockNumber,
      );
    }

    if (requestInput.createdAt !== undefined) {
      assert.strictEqual(
        requestInput.createdAt,
        requestOutput.createdAt,
      );
    }

    if (requestInput.updatedAt !== undefined) {
      assert.strictEqual(
        requestInput.updatedAt,
        requestOutput.updatedAt,
      );
    }
  },

};

export default Util;
