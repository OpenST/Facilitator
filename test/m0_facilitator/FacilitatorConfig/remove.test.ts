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


import fs from 'fs-extra';
import sinon from 'sinon';

import { FacilitatorConfig } from '../../../src/m0_facilitator/Config/Config';
import Directory from '../../../src/m0_facilitator/Directory';
import SpyAssert from '../../test_utils/SpyAssert';

describe('FacilitatorConfig.remove()', () => {
  it('should remove facilitator config from default path', async () => {
    const auxChainId = 300;
    const originChain = 'dev';
    const dummyGatewayAddress = '0x34817AF7B685DBD8a360e8Bed3121eb03D56C9BD';

    const removeSyncStub = sinon.stub(
      fs,
      'removeSync',
    );
    const somePath = 'Some Path';
    const dirStub = sinon.replace(
      Directory,
      'getFacilitatorConfigPath',
      sinon.fake.returns(somePath),
    );
    FacilitatorConfig.remove(originChain, auxChainId, dummyGatewayAddress);

    SpyAssert.assert(dirStub, 1, [[originChain, auxChainId, dummyGatewayAddress]]);
    SpyAssert.assert(removeSyncStub, 1, [[somePath]]);
    sinon.restore();
  });
});
