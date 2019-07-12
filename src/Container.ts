import Facilitator from './Facilitator';
import ConfigFactory from './Config/ConfigFactory';
import Repositories from './repositories/Repositories';
import Services from './services/Services';
import Subscriptions from './subscriptions/Subscriptions';
import TransactionHandler from './TransactionHandler';
import Handlers from './handlers/HandlerFactory';

export default class Container {
  /**
   * This instantiate all the dependencies.
   * @param originChain Origin chain Identifier
   * @param auxChainId Auxiliary chain ID.
   * @param mosaicConfigPath Mosaic Config path.
   * @param facilitatorConfigPath Facilitator config path.
   */
  public async create(
    originChain?: string,
    auxChainId?: string,
    mosaicConfigPath?: string,
    facilitatorConfigPath?: string,
  ): Promise<Facilitator> {
    const facilitatorStart: ConfigFactory = new ConfigFactory(
      originChain,
      auxChainId ? Number.parseInt(auxChainId, 10) : undefined,
      mosaicConfigPath,
      facilitatorConfigPath,
    );
    const config = facilitatorStart.getConfig();

    const repositories = await Repositories.create();
    const transactionHandler = new TransactionHandler(
      Handlers.create(repositories, config.facilitator.auxChainId),

    );
    const subscriptions = await Subscriptions.create(
      transactionHandler,
      repositories,
    );

    const services = Services.create(repositories, config);

    repositories.attach(services);

    return new Facilitator(subscriptions.originSubscriber, subscriptions.auxiliarySubscriber);
  }
}
