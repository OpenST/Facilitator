const FetchQueries: Record<string, string> = {
  stakeRequesteds: 'query ($contractAddress: Bytes!, $uts: BigInt!, $skip: Int!) {\n'
  + 'stakeRequesteds(orderBy: uts, orderDirection: asc, first: 100, skip: $skip, where:'
  + ' {contractAddress: $contractAddress, uts_gt: $uts}) {\n'
  + '    id\n'
  + '    amount\n'
  + '    gasPrice\n'
  + '    gasLimit\n'
  + '    staker\n'
  + '    stakerProxy\n'
  + '    gateway\n'
  + '    stakeRequestHash\n'
  + '    nonce\n'
  + '    beneficiary\n'
  + '    contractAddress\n'
  + '    blockNumber\n'
  + '    uts\n'
  + '  }\n'
  + '}',

  stakeIntentDeclareds: 'query ($contractAddress: Bytes!, $uts: BigInt!, $skip: Int!) {\n'
  + 'stakeIntentDeclareds(orderBy: uts, orderDirection: asc, first: 100, skip: $skip, , where:'
  + ' {contractAddress: $contractAddress, uts_gt: $uts}) {\n'
  + '    id\n'
  + '    _messageHash\n'
  + '    _staker\n'
  + '    _stakerNonce\n'
  + '    _amount\n'
  + '    contractAddress\n'
  + '    blockNumber\n'
  + '    uts\n'
  + '  }\n'
  + '}',

  stateRootAvailables: 'query ($contractAddress: Bytes!, $uts: BigInt!, $skip: Int!) {\n'
  + 'stateRootAvailables(orderBy: uts, orderDirection: asc, first: 100, skip: $skip, where:'
  + ' {contractAddress: $contractAddress, uts_gt: $uts}) {\n'
  + '    id\n'
  + '    _blockHeight\n'
  + '    _stateRoot\n'
  + '    contractAddress\n'
  + '    blockNumber\n'
  + '    uts\n'
  + '  }\n'
  + '}',

  gatewayProvens: 'query ($contractAddress: Bytes!, $uts: BigInt!, $skip: Int!) {\n'
  + 'gatewayProvens(orderBy: blockNumber, orderDirection: asc, first: 100, skip: $skip, where:'
  + ' {contractAddress: $contractAddress, uts_gt: $uts}) {\n'
  + '    id\n'
  + '    _gateway\n'
  + '    _blockHeight\n'
  + '    _storageRoot\n'
  + '    _wasAlreadyProved\n'
  + '    contractAddress\n'
  + '    blockNumber\n'
  + '    uts\n'
  + '  }\n'
  + '}',

  stakeIntentConfirmeds: 'query ($contractAddress: Bytes!, $uts: BigInt!, $skip: Int!) {\n'
  + 'stakeIntentConfirmeds(orderBy: uts, orderDirection: asc, first:100, skip: $skip, where:'
  + ' {contractAddress: $contractAddress, uts_gt: $uts}) {\n'
  + '    id\n'
  + '    _messageHash\n'
  + '    _staker\n'
  + '    _stakerNonce\n'
  + '    _beneficiary\n'
  + '    _amount\n'
  + '    _blockHeight\n'
  + '    _hashLock\n'
  + '    contractAddress\n'
  + '    blockNumber\n'
  + '    uts\n'
  + '  }\n'
  + '}',

  stakeProgresseds: 'query ($contractAddress: Bytes!, $uts: BigInt!, $skip: Int!) {\n'
  + 'stakeProgresseds(orderBy: uts, orderDirection: asc, first: 100, skip: $skip, where:'
  + ' {contractAddress:'
  + ' $contractAddress, uts_gt: $uts}) {\n'
  + '    id\n'
  + '    _messageHash\n'
  + '    _staker\n'
  + '    _stakerNonce\n'
  + '    _amount\n'
  + '    _proofProgress\n'
  + '    _unlockSecret\n'
  + '    contractAddress\n'
  + '    blockNumber\n'
  + '    uts\n'
  + '  }\n'
  + '}',

  mintProgresseds: 'query ($contractAddress: Bytes!, $uts: BigInt!, $skip: Int!) {\n'
  + 'mintProgresseds(orderBy: uts, orderDirection: asc, first: 100, skip: $skip, where:'
  + ' {contractAddress: $contractAddress, uts_gt: $uts}) {\n'
  + '    id\n'
  + '    _messageHash\n'
  + '    _staker\n'
  + '    _beneficiary\n'
  + '    _stakeAmount\n'
  + '    _mintedAmount\n'
  + '    _rewardAmount\n'
  + '    _proofProgress\n'
  + '    _unlockSecret\n'
  + '    contractAddress\n'
  + '    blockNumber\n'
  + '    uts\n'
  + '  }\n'
  + '}',

};

export default FetchQueries;
