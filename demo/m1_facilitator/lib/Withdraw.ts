import * as fs from 'fs';
import Mosaic from 'Mosaic';
import Web3 from 'web3';

import Utils from './Utils';

export default class Withdraw {
  public static async requestWithdraw(
    metachainRpcEndpoint: string,
    utilityTokenAddress: string,
    erc20CogatewayAddress: string,
    gasPrice: string,
    withdrawerKeystore: string,
    password: string,
    withdrawRequestParams: {
      amountToWithdraw: string;
      beneficiary: string;
      gasPrice: string;
      gasLimit: string;
    },
  ): Promise<void> {
    const web3 = new Web3(metachainRpcEndpoint);

    // To reduce wait time on testnet.
    web3.transactionConfirmationBlocks = 1;
    const keystore = JSON.parse(fs.readFileSync(withdrawerKeystore).toString());
    const withdrawerAccount = web3.eth.accounts.decrypt(keystore, password);
    web3.eth.accounts.wallet.add(withdrawerAccount);
    const withdrawerAddress = withdrawerAccount.address;
    console.log(`Requesting deposit from depositor ${withdrawerAddress}`);
    const tokenInstance = Mosaic.interacts.getERC20I(
      web3,
      utilityTokenAddress,
    );
    console.log('Approving utility tokens to ERC20Cogateway.');
    const approveRawTx = tokenInstance.methods.approve(
      erc20CogatewayAddress,
      withdrawRequestParams.amountToWithdraw,
    );

    const approvalReceipt = await Utils.sendTransaction(approveRawTx, {
      from: withdrawerAddress,
      gasPrice,
    });

    console.log('Utility token approval to ERC20Cogateway done transaction hash: ', approvalReceipt.transactionHash);

    console.log('Requesting Withdraw.');

    const erc20CogatewayInstance = Mosaic.interacts.getERC20Cogateway(web3, erc20CogatewayAddress);

    const txObject = erc20CogatewayInstance.methods.withdraw(
      withdrawRequestParams.amountToWithdraw,
      withdrawRequestParams.beneficiary,
      withdrawRequestParams.gasPrice,
      withdrawRequestParams.gasLimit,
      utilityTokenAddress,
    );

    const receipt = await Utils.sendTransaction(txObject, {
      from: withdrawerAddress,
      gasPrice,
    });

    console.log('Request withdraw done with transaction hash: ', receipt.transactionHash);
    console.log('Request withdraw done with message hash: ', receipt.events.WithdrawIntentDeclared.returnValues.messageHash);
    console.log(`🤝 Facilitators are moving your tokens to origin chain. Check beneficiary ${withdrawRequestParams.beneficiary} balance on origin chain after few minutes.`);
    console.log(`Check beneficiary account on etherscan https://goerli.etherscan.io/address/${withdrawRequestParams.beneficiary}`);
  }
}
