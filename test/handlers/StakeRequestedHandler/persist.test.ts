import BigNumber from 'bignumber.js';
import sinon from 'sinon';
import * as Web3Utils from 'web3-utils';

import StakeRequestHandler from '../../../src/handlers/StakeRequestHandler';
import StakeRequest from '../../../src/models/StakeRequest';
import StakeRequestRepository from '../../../src/repositories/StakeRequestRepository';
import assert from '../../test_utils/assert';
import SpyAssert from '../../test_utils/SpyAssert';

describe('StakeRequestedHandler.persist()', (): void => {
  it('should persist successfully', async (): Promise<void> => {
    const gatewayAddress = '0x0000000000000000000000000000000000000002';
    const transactions = [{
      id: '1',
      stakeRequestHash: Web3Utils.sha3('1'),
      amount: '10',
      beneficiary: '0x0000000000000000000000000000000000000001',
      gasPrice: '1',
      gasLimit: '1',
      nonce: '1',
      gateway: gatewayAddress,
      staker: '0x0000000000000000000000000000000000000003',
      stakerProxy: '0x0000000000000000000000000000000000000004',
    }];

    const saveStub = sinon.stub();
    const sinonMock = sinon.createStubInstance(StakeRequestRepository, {
      save: saveStub as any,
    });
    const handler = new StakeRequestHandler(
      sinonMock as any,
      gatewayAddress,
    );

    const models = await handler.persist(transactions);

    const stakeRequest = new StakeRequest(
      transactions[0].stakeRequestHash,
      new BigNumber(transactions[0].amount),
      Web3Utils.toChecksumAddress(transactions[0].beneficiary),
      new BigNumber(transactions[0].gasPrice),
      new BigNumber(transactions[0].gasLimit),
      new BigNumber(transactions[0].nonce),
      Web3Utils.toChecksumAddress(transactions[0].gateway),
      Web3Utils.toChecksumAddress(transactions[0].staker),
      Web3Utils.toChecksumAddress(transactions[0].stakerProxy),
    );

    assert.equal(
      models.length,
      transactions.length,
      'Number of models must be equal to transactions',
    );
    assert.deepStrictEqual(models[0], stakeRequest);
    SpyAssert.assert(saveStub, 1, [[stakeRequest]]);
  });
});
