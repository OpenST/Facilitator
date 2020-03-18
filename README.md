# 🤝 Facilitator

Mosaic facilitator is an executable which enables atomic token transfers across two blockchains. Facilitator executable facilitates `stake & mint` and `redeem & unstake` of any EIP20 token using mosaic gateways. Facilitator earns reward for facilitating token transfers across two blockchains.

## Prerequisite
1. Tested with docker version `18.09.1`.
2. Tested with docker compose version `1.23.2`.
3. Tested with node version `v11.2.0`.
4. Install mosaic chains
   ```
   npm i @openst/mosaic-chains -g
   ```
5. Install facilitator 
   ```
   npm i @openst/facilitator -g
   ```   
6. Funds on origin chain and auxiliary chain are needed to perform transactions. `For origin chain gas and Simple Token` balance is needed. `For auxiliary chain gas` balance is needed.
   For testnet, mosaic faucet can be used to get Simple Token on origin chain and gas on auxiliary chain. Documentation about faucet is available [here](https://github.com/mosaicdao/faucet)   
7. `Simple Token balance on origin chain` is required to stake bounty in the gateway or to mint gas for auxiliary chain. `gas on auxiliary chain` is required to stake bounty for redeem 
   and unstake request.
8. Mosaic commands need a signer for signing transactions. Refer [signing of transaction](https://github.com/mosaicdao/mosaic-chains#signing-of-transaction) section for setting up signer for geth and parity node.      

## Setup facilitator
 
 **1. Start pair of chains**:
   
   You can skip this step, if there is an existing chain pair and graph node is already running. 
   
   *Start origin chain*: 

      mosaic start <origin-chain-identifier>
            
   *Start auxiliary chain*:
 
      mosaic start <auxiliary chain> --origin <origin-chain-identifier>
      
   *Example*:

      mosaic start ropsten
      mosaic start 1405 --origin ropsten

      
 Once chains have been successfully started, it will display web3 endpoint, graph admin rpc endpoint, graph ws endpoint and ipfs url. `Please keep a copy of these urls`. These URLs will be needed in 
 further steps.
 To connect to these chains, one can use below command:
```
 mosaic attach <chain-name>
```
*Example*:
```
mosaic attach ropsten
```
 
Documentation of supported mosaic chains can be found [here](https://github.com/mosaicdao/mosaic-chains).      


 **2. Deploy stake pool and redeem pool**:  

Skip this step if stake and redeem pool contracts already exists and you own the owner/admin keys used while deployment.

**Deploy stake pool**: 

For deploying stake pool contract, 3 keys are needed. Please make sure below keys are available before moving to next step.

- `deployer`: Deployer deploys stake pool and organization contract. It should have `gas on origin chain` for deploying contracts. `Deployer address must be unlocked`.
- `organizationOwner`: Organization owner is the owner of organization contract.
- `organizationAdmin`: Organization admin is the admin of organization contract. It should have `gas on origin chain`. Organization admin key will `whitelist worker keys` in
 further steps.

Use below command to deploy stake pool contract for facilitation of stake and mint requests.
       
```
mosaic setup-stake-pool <originChain> <originWeb3EndPoint> <deployer> <organizationOwner> <organizationAdmin>
```
Example:
```
mosaic setup-stake-pool 12346  http://localhost:8545 0x913da4198e6be1d5f5e4a40d0667f70c0b5430eb 0x913da4198e6be1d5f5e4a40d0667f70c0b5430eb 0x913da4198e6be1d5f5e4a40d0667f70c0b5430eb
```
  
**Deploy redeem pool**: 

For deploying redeem pool contract, 3 keys are needed. Please make sure below keys are available before moving to next step.

- `deployer`: Deployer deploys redeem pool and organization contract. It should have `gas on auxiliary chain` for deploying contracts. `Deployer address must be unlocked`.
- `organizationOwner`: Organization owner is the owner of organization contract.
- `organizationAdmin`: Organization admin is the admin of organization contract. It should have `gas on auxiliary chain`. Organization admin key will be needed to `whitelist worker keys`
 in further step.

Use below command to deploy redeem pool contract for facilitation of redeem and unstake requests.

```
mosaic setup-redeem-pool <originChain> <auxiliaryChain> <auxChainWeb3EndPoint> <deployer> <organizationOwner> <organizationAdmin>
```
Example:
```
mosaic setup-redeem-pool 12346 500 http://localhost:40500 0x0000000000000000000000000000000000000001 0x0000000000000000000000000000000000000001 0x0000000000000000000000000000000000000001
```
 
 Documentation for deployment of stake and redeem pool contracts can be found [here](https://github.com/mosaicdao/mosaic-chains#stake-pool).
 
 **3. Deploy subgraphs**: Origin and auxiliary subgraphs are needed for facilitator executable. Each command will print the subgraph urls. Keep a `copy of subgraph urls` as it will be required at facilitator-init step. 
 Below commands will deploy origin and auxiliary subgraph. 

*Deploy origin subgraph*: Below command will deploy origin subgraph. 
```
mosaic subgraph <origin-chain-identifier> <auxiliary-chain-identifier> origin <origin-graph-admin-url> <origin-graph-ipfs-url> 

```
**Note:** `<origin-graph-admin-url>` and `<origin-graph-ipfs-url>` was displayed while starting origin chain.

*Deploy auxiliary subgraph*: Below command will deploy auxiliary sugraph.

```
mosaic subgraph <origin-chain-identifier> <auxiliary-chain-identifier> auxiliary <aux-graph-admin-url> <aux-graph-ipfs-url> 

```
**Note:** `<aux-graph-admin-url>` and `<aux-graph-ipfs-url>` was displayed while starting auxiliary chain.

By default subgraph command deploys subgraph for OST gateways. optionally it also accepts `--mosaic-config`, `--gateway-config` and `--gateway-address` option to deploy subgraph for other gateways. 

Refer [here](https://github.com/mosaicdao/mosaic-chains#mosaic-config) to locate Mosaic config.
Refer [here](https://github.com/mosaicdao/mosaic-chains#gateway-config) to locate Gateway config.

More documentation about `subgraph` command can be found [here](https://github.com/mosaicdao/mosaic-chains#subgraph-deployment).

**4. Facilitator init**: Facilitator init command initializes & populates seed data in database, generates worker addresses & encrypted keys for them and creates facilitator config file.  
Facilitator config is needed to start facilitator.  

```
facilitator init --mosaic-config <mosaic-config> --aux-chain-id <aux-chain-id> --origin-password <origin-password> --auxiliary-password <auxiliary-password> --origin-rpc <origin-rpc> --auxiliary-rpc <auxiliary-rpc> --origin-graph-ws <origin-graph-ws> --origin-graph-rpc <origin-graph-rpc> --auxiliary-graph-ws <auxiliary-graph-ws> --auxiliary-graph-rpc <auxiliary-graph-rpc> --db-path <db-path> --force

```

* Replace `<mosaic-config>` with file location. Refer [here](https://github.com/mosaicdao/mosaic-chains#mosaic-config) for details.
* Replace `<aux-chain-id>` with auxiliary chain id. 
* Replace `<origin-password>` with the password required to encrypt the worker account of origin chain created with this command. It will be required to unlock worker account while starting facilitator.
* Replace `<auxiliary-password>` with the password required to encrypt the worker account of auxiliary chain created with this command. It will be required to unlock worker account while starting facilitator.
* Replace `<origin-rpc>` with origin chain's rpc url.
* Replace `<auxiliary-rpc>` with auxiliary chain's rpc url.
* Replace `<origin-graph-ws>` with origin subgraph ws endpoint provided in subgraph deployment step.
* Replace `<origin-graph-rpc>` with origin subgraph rpc admin endpoint provided in subgraph deployment step.
* Replace `<auxiliary-graph-ws>` with auxiliary subgraph ws endpoint provided in subgraph deployment step.
* Replace `<auxiliary-graph-rpc>` with auxiliary subgraph rpc admin endpoint provided in subgraph deployment step.
* Replace `<db-path>` with the database path. It is the path for `sqlite` database. If not provided, it would create it.
* `--force` option is used to forcefully override facilitator config. It is an optional parameter.


Facilitator init can also be done with `--gateway-config <gateway-config>` option. Refer [here](https://github.com/mosaicdao/mosaic-chains#gateway-config ) to locate gateway config.

Replace <gateway-config> with file location where gateway config is present.


This command will generate facilitator config file which is needed to start facilitator. `Back up facilitator-config file` as it contains encrypted keys which will own funds.


**5. Set ENV variables**: Facilitator init command create worker keys which are encrypted with password. Enviornment variables need to be set to unlock the encrypted keystore file. 

Set below environment variables after replacing address and password.
```
export MOSAIC_ADDRESS_PASSW_<Address>=<origin-password>
export MOSAIC_ADDRESS_PASSW_<Address>=<auxiliary-password>
```
Above variables will also be produced with the output of `facilitator init` command.

**6. Fund facilitator workers for gas and bounty**: Workers created in facilitator init step needs to be `funded for gas and bounty` on both chains.

   **Gas on origin**: Facilitator needs to pay for gas on origin chain. Origin worker address created in `facilitator init` step must be funded to pay for transactions fees. 
   
   There are various ways to fund worker on origin chain. For testnet any public faucet can be used. Below web3 transaction can also be done, if there is fund in an existing key.
   
      
      web3.eth.sendTransaction(
      {
         from:<funder_address>, 
          to: <origin_worker>,
          value:<Fund_in_wei
      })
      
   **Gas on auxiliary**: Facilitator also needs to pay for transactions fees on auxiliary chain. For testnet [mosaic faucet](https://github.com/mosaicdao/faucet) can be used to get funds. 
   Alternatively, Simple Token on value chain can also be converted to base token on auxiliary chain in order to pay for gas.
   
   **Bounty**: Facilitator needs to stake bounty to gateway/co-gateway in order to perform stake & mint and redeem & unstake. `Bounty token on the origin chain for existing mosaic 
   chain is Simple Token and on the auxiliary chain bounty is base token`. 
   
   On testnet, bounty can be funded to workers using [mosaic faucet](https://github.com/mosaicdao/faucet).
   
**7. White list workers**: Origin and auxiliary workers should be whitelisted in stake pool and redeem pool contracts respectively. Below commands will whitelist the workers. 

   1. Clone git repository:
       ```
           git clone https://github.com/mosaicdao/mosaic-chains.git
       ```
   
   2. Install dependencies:
        ```
            npm ci
        ```
   
   3. Set below environment variables
    
    export ORIGIN_WEB3_ENDPOINT='replace_with_origin_web3_endpoint';
    export AUXILIARY_WEB3_ENDPOINT='replace_with_auxiliary_web3_endpoint';
    export AUXILIARY_CHAIN_ID='replace_with_auxiliary_chain_id';
    export MOSAIC_CONFIG_PATH='replace_with_mosaic_config_path';
    export ORIGIN_WORKER_ADDRESS='replace_with_origin_worker_address';
    export AUXILIARY_WORKER_ADDRESS='replace_with_auxiliary_worker_address';
    export ORIGIN_WORKER_EXPIRATION_HEIGHT='replace_with_origin_expiration_height';
    export AUXILIARY_WORKER_EXPIRATION_HEIGHT='replace_with_auxiliary_expiration_height';

Origin and auxiliary worker addresses are generated with `facilitator init` step. 
Refer [here](https://github.com/mosaicdao/mosaic-chains#mosaic-config) to locate Mosaic config path for supported chain.  

Origin and auxiliary worker expiration height is block height from current block for which worker keys are whitelisted. If current block is 1000 and expiration height is set to 100 then worker keys will be whitelisted for 1100 block.

   run command:
     
     npm run whitelist-workers
         

   **Note**: This command expects admin address of stake pool and redeem pool organization contracts to be unlocked on the node. 
    

**8. Facilitator start**: Facilitator start command starts the facilitator process. 
- If facilitator-init is done using `<mosaic-config>` option, then use below command
```
facilitator start <origin-chain-identifier> <aux-chain-id> --facilitator-config <facilitator-config> --mosaic-config <mosaic-config>

```

- If facilitator-init is done using `<gateway-config>` option, then use below command
```
facilitator start <origin-chain-identifier> <aux-chain-id> --facilitator-config <facilitator-config> --gateway-config <gateway-config>

```

* Replace `<origin-chain-identifier>` with name of the origin chain identifier.
* Replace `<aux-chain-id>` with id of the auxiliary chain identifier. E.g. 1405, 1406, 1407.
* Replace `<facilitator-config>` with the path to facilitator-config.json generated using `facilitator init`. Path will be at location `~/.mosaic/<aux-chain-id>/facilitator-config.json`.   
* Replace `<gateway-config>` with the path to gateway-config.json. Refer [here](https://github.com/mosaicdao/mosaic-chains#gateway-config) for details.
* Replace `<mosaic-config>` with the path to mosaic-config.json. Refer [here](https://github.com/mosaicdao/mosaic-chains#mosaic-config) for details.


Details about facilitator start command can be found in [facilitator start options section](#Facilitator-start-options).


## Starting facilitator

Facilitator can be started in below two ways :-

### Facilitator start for EIP20 gateways:	
1. `./facilitator start --facilitator-config <facilitator-config> --mosaic-config <mosaic-config>`
    * Replace `<facilitator-config>` with the path to facilitator-config.json generated using `facilitator init`.   
    * Replace `<mosaic-config>` with the path to mosaic-config.json.
	* When `--mosaic-config` and `--facilitator-config` is given then it will read gateway and facilitator configs from `<gateway-config>` and `<facilitator-config>` paths respectively and validates origin and aux chain id's.

2. `./facilitator start <origin-chain-identifier> <aux-chain-id> --facilitator-config <facilitator-config> --mosaic-config <mosaic-config>`
	* Replace `<origin-chain-identifier>` with name of the origin chain.
	* Replace `<aux-chain-id>` with id of the auxiliary chain.
	* Replace `<facilitator-config>` with the path to facilitator-config.json generated using `facilitator init`.   
    * Replace `<mosaic-config>` with the path to mosaic.json. Refer [here](https://github.com/mosaicdao/mosaic-chains#mosaic-config) for details.
    * It validates `<origin-chain-identifier>` and `<auxiliary-chain>` id's in faciltiator and mosaic configs.
    
3.  `./facilitator start <origin-chain-identifier> <aux-chain-id>`
	* It loads mosaic config and facilitator config from default paths.    

4.  `./facilitator start --facilitator-config <facilitator-config>`
	* It loads facilitator from `<facilitator-config>` path.
		
### Facilitator start for mosaic gateways:

1. `./facilitator start --facilitator-config <facilitator-config> --gateway-config <gateway-config>`
    * Replace `<facilitator-config>` with the path to facilitator-config.json generated using `facilitator init`.   
    * Replace `<gateway-config>` with the path to gateway-config.json. Refer [here](https://github.com/mosaicdao/mosaic-chains#gateway-config)
	* When `--gateway-config` and `--facilitator-config` is given then it will read gateway and facilitator configs from `<gateway-config>` and `<facilitator-config>` paths respectively and validates origin and aux chain id's.

2. `./facilitator start <origin-chain-identifier> <aux-chain-id> --facilitator-config <facilitator-config> --gateway-config <gateway-config>`
	* Replace `<origin-chain-identifier>` with name of the origin chain.
	* Replace `<aux-chain-id>` with id of the auxiliary chain.
	* Replace `<facilitator-config>` with the path to facilitator-config.json generated using `facilitator init`.   
    * Replace `<gateway-config>` with the path to gateway-config.json. Refer [here](https://github.com/mosaicdao/mosaic-chains#gateway-config)	    
    
  * **Note** : Both `--mosaic-config` and `--gateway-config` together are not allowed in command.
  
  ### Mint gas on OST testnet
  
  Refer detailed document [here](demo/README.md). 
 
### Deploy mosaic subgraph
    
  ##### Deploy origin subgraph: 
  ```bash
  npm run deploy:subgraph:origin <originAchorAddress> <gatewayAddress> <graphAdminRpcEndpoint> <ipfsEndpoint>

```

where: 

`originAchorAddress` is the address of origin anchor contract.
`gatewayAddress` is the address of origin gateway contract.
`graphAdminRpcEndpoint` is admin RPC endpoint of graph node.
`ipfsEndPoint` is IPFS endpoint.

  ##### Deploy auxiliary subgraph:

```bash
npm run deploy:subgraph:auxiliary <auxiliaryAnchorAddress> <coGatwayAddress> <graphAdminRpcEndpoint> <ipfsEndpoint>
```

where: 

`auxiliaryAchorAddress` is the address of origin anchor contract.
`coGatwayAddress` is the address of auxiliary cogateway contract.
`graphAdminRpcEndpoint` is admin RPC endpoint of graph node.
`ipfsEndPoint` is IPFS endpoint.


# Facilitator

Facilitator is an executable which facilitates `deposit & withdrawal` of any EIP20 tokens using ERC20Gateways.

1. Deploy subgraphs:

    i. Deploy origin subgraph: Subgraphs for origin chain must be deployed for facilitator to run. Below is the command to deploy subgraph at origin chain :

        npm run deploy:subgraph:origin <originAchorAddress> <gatewayAddress> <graphAdminRpcEndpoint> <ipfsEndpoint>
    * Replace `<originAchorAddress>` with anchor address at origin chain.
    * Replace `<gatewayAddress>` with the address of gateway contract at origin chain.
    * Replace `<graphAdminRpcEndpoint>` with the admin rpc endpoint of graph node for origin chain.
    * Replace `<ipfsEndpoint>` with the ipfs endpoint of graph node for origin chain.

    ii. Deploy auxiliary subgraph: Subgraphs for auxiliary chain must be deployed for facilitator to run. Below is the command to deploy subgraph at auxiliary chain :

        npm run deploy:subgraph:auxiliary <auxiliaryAnchorAddress> <coGatwayAddress> <graphAdminRpcEndpoint> <ipfsEndpoint>
    * Replace `<auxiliaryAnchorAddress>` with anchor address at auxiliary chain.
    * Replace `<coGatwayAddress>` with the address of coGateway contract at auxiliary chain.
    * Replace `<graphAdminRpcEndpoint>` with the admin rpc endpoint of graph node for auxiliary chain.
    * Replace `<ipfsEndpoint>` with the ipfs endpoint of graph node for auxiliary chain.

3. Manifest file is required to initialize and start facilitator. It must be an valid yaml file. Format for manifest file :
```
version: v0.14
architecture_layout: MOSAIC1
personas:
  - facilitator
metachain:
  origin:
    avatar_account: "<account_at_origin_chain>"
    node_endpoint: "<origin_chain_url>"
    graph_ws_endpoint: "<graph-node-ws-endpoint>"
    graph_rpc_endpoint: "<graph-node-rpc-endpoint>"
  auxiliary:
    avatar_account: "<account_at_auxiliary_chain>"
    node_endpoint: "<auxiliary_chain_url>"
    graph_ws_endpoint: "<graph-node-ws-endpoint>"
    graph_rpc_endpoint: "<graph-node-rpc-endpoint>"
accounts:
  <account_at_origin_chain>:
    keystore_path: "<origin_account_keystore_file>"
    keystore_password_path: "<origin_account_password_file>"
  <account_at_auxiliary_chain>:
    keystore_path: "<auxiliary_account_keystore_file>"
    keystore_password_path: "<auxiliary_account_password_file>"
origin_contract_addresses:
    erc20_gateway: <erc20Gateway_contract_address>
facilitate_tokens:
    - "<supported_tokens>"
```
* Create account on origin and metachain nodes. At origin, fund avatar account with ETH. At metachain, fund avatar account with base coin. Save the keystore files. For each account, create a password file.
* Replace `<account_at_origin_chain>` with the address generated at origin node.
* Replace `<account_at_auxiliary_chain>` with the address generated at auxiliary node.
* Replace `<origin_chain_url>` with endpoint of origin chain.
* Replace `<auxiliary_chain_url>` with endpoint of auxiliary chain.
* Replace `<graph-node-ws-endpoint>` with ws endpoint of graph node.
* Replace `<graph-node-rpc-endpoint>` with rpc endpoint of graph node.
* Replace `<origin_account_keystore_file>` with path of keystore file of origin account.
* Replace `<origin_account_password_file>` with path to password file for auxiliary account.
* Replace `<auxiliary_account_keystore_file>` with path to keystore file of auxiliary account.
* Replace `<auxiliary_account_password_file>` with path to password file for auxiliary account.
* Replace `<erc20Gateway_contract_address>` with address of erc20gateway contract address at origin chain.
* Replace `<supported_tokens>` with the token address for which facilitation needs to be done. It can be specified in list format supported by yaml.

Example:
```
version: v0.14
architecture_layout: MOSAIC1
personas:
  - facilitator
metachain:
  origin:
    avatar_account: "0xcd8b7d0211e51b78d3fd1209ca8a6955fc7dfbca"
    node_endpoint: https://rpc.slock.it/goerli
    graph_ws_endpoint: ws://localhost:8000/subgraphs/name/m1_facilitator
    graph_rpc_endpoint: http://localhost:8000/subgraphs/name/m1_facilitator
  auxiliary:
    avatar_account: "0xd14087a083fdd4049dcf1e7eb01ee2f5c89eb1c9"
    node_endpoint: https://chain.mosaicdao.org/hadapsar
    graph_ws_endpoint: ws://localhost:8000/subgraphs/name/m1_facilitator
    graph_rpc_endpoint: http://localhost:8000/subgraphs/name/m1_facilitator
accounts:
  "0xcd8b7d0211e51b78d3fd1209ca8a6955fc7dfbca":
    keystore_path: "0xcD8b7D0211E51B78d3fd1209CA8A6955FC7dFBca.json"
    keystore_password_path: "0xcD8b7D0211E51B78d3fd1209CA8A6955FC7dFBca.password"
  "0xd14087a083fdd4049dcf1e7eb01ee2f5c89eb1c9":
    keystore_path: "0xD14087A083fDd4049dcF1E7Eb01ee2f5C89eb1C9.json"
    keystore_password_path: "0xD14087A083fDd4049dcF1E7Eb01ee2f5C89eb1C9.password"
origin_contract_addresses:
    erc20_gateway: "0x65E1A3d1e95E271325B882aa139997AFAE6F0351"
facilitate_tokens:
    - "0x0000000000000000000000000000000000000012"
```

3. **Facilitator init**: It loads manifest file, creates database and initializes seed data.

```
./facilitator_m1 init --manifest <manifest>
```

* Replace `<manifest>` with the path to manifest file.

Example:
```
./facilitator_m1 init --manifest facilitator_manifest.yml
```

4. **Facilitator start**: Facilitator start command loads manifest file and starts facilitation process.

```
./facilitator_m1 start --manifest  facilitator_manifest.yml
```

* Replace `<manifest>` with the path to manifest file.
