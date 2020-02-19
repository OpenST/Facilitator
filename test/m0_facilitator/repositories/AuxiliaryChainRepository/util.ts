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


import AuxiliaryChain from '../../../../src/m0_facilitator/models/AuxiliaryChain';
import assert from '../../../test_utils/assert';

const Util = {
  assertAuxiliaryChainAttributes(
    inputAuxiliaryChain: AuxiliaryChain,
    expectedAuxiliaryChain: AuxiliaryChain,
  ): void {
    assert.strictEqual(
      inputAuxiliaryChain.chainId,
      expectedAuxiliaryChain.chainId,
      'chainId should match',
    );

    assert.strictEqual(
      inputAuxiliaryChain.originChainName,
      expectedAuxiliaryChain.originChainName,
      'originChainName should match',
    );

    assert.strictEqual(
      inputAuxiliaryChain.eip20GatewayAddress,
      expectedAuxiliaryChain.eip20GatewayAddress,
      'eip20GatewayAddress should match',
    );

    assert.strictEqual(
      inputAuxiliaryChain.eip20CoGatewayAddress,
      expectedAuxiliaryChain.eip20CoGatewayAddress,
      'eip20CoGatewayAddress should match',
    );

    assert.strictEqual(
      inputAuxiliaryChain.anchorAddress,
      expectedAuxiliaryChain.anchorAddress,
      'anchorAddress should match',
    );

    assert.strictEqual(
      inputAuxiliaryChain.coAnchorAddress,
      expectedAuxiliaryChain.coAnchorAddress,
      'coAnchorAddress should match',
    );

    if (inputAuxiliaryChain.lastOriginBlockHeight) {
      assert.notStrictEqual(
        inputAuxiliaryChain.lastOriginBlockHeight,
        expectedAuxiliaryChain.lastOriginBlockHeight,
        'lastOriginBlockHeight should match',
      );
    }

    if (inputAuxiliaryChain.lastAuxiliaryBlockHeight) {
      assert.notStrictEqual(
        inputAuxiliaryChain.lastAuxiliaryBlockHeight,
        expectedAuxiliaryChain.lastAuxiliaryBlockHeight,
        'lastAuxiliaryBlockHeight should match',
      );
    }

    if (inputAuxiliaryChain.createdAt && expectedAuxiliaryChain.createdAt) {
      assert.strictEqual(
        inputAuxiliaryChain.createdAt.getTime(),
        expectedAuxiliaryChain.createdAt.getTime(),
        'Expected created at time is different than the one received in response',
      );
    }

    assert.isNotNull(
      inputAuxiliaryChain.updatedAt,
      'Updated at should not be null',
    );
  },

};

export default Util;
