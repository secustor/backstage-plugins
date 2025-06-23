import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { actionsRegistryServiceRef } from '@backstage/backend-plugin-api/alpha';
import { createRouter } from './service/router';
import {
  renovateReport,
  RenovateWrapper,
  targetRepo,
} from '@secustor/backstage-plugin-renovate-common';
import { RenovateRunner } from './wrapper';
import { RouterOptions } from './service/types';
import { DatabaseHandler } from './service/databaseHandler';
import {
  QueueFactory,
  renovateQueueExtensionPoint,
  renovateRuntimeExtensionPoint,
  RunOptions,
} from '@secustor/backstage-plugin-renovate-node';
import { scheduleJobSync } from './service/jobSync';
import { scheduleCleanupTask } from './service/cleanupTask';

/**
 * Renovate backend plugin
 *
 * @public
 */
export const renovatePlugin = createBackendPlugin({
  pluginId: 'renovate',
  register(env) {
    // allow modules provide additional runtimes
    const runtimes = new Map<string, RenovateWrapper>();
    env.registerExtensionPoint(renovateRuntimeExtensionPoint, {
      addRuntime(id: string, runtime: RenovateWrapper) {
        if (runtimes.has(id)) {
          throw new Error(
            ` ${id} has been already registered. Only one wrapper with the same ID is allowed to be registered`,
          );
        }
        runtimes.set(id, runtime);
      },
    });

    const queueFactories = new Map<string, QueueFactory<RunOptions>>();
    env.registerExtensionPoint(renovateQueueExtensionPoint, {
      addQueueFactory(id: string, factory: QueueFactory<RunOptions>) {
        if (queueFactories.has(id)) {
          throw new Error(
            ` ${id} has been already registered. Only one queue with the same ID is allowed to be registered`,
          );
        }
        queueFactories.set(id, factory);
      },
    });

    env.registerInit({
      deps: {
        actionsRegistry: actionsRegistryServiceRef,
        rootConfig: coreServices.rootConfig,
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
        database: coreServices.database,
        scheduler: coreServices.scheduler,
        discovery: coreServices.discovery,
        auth: coreServices.auth,
      },
      async init(options) {
        const { actionsRegistry, database, httpRouter, logger } = options;

        const databaseHandler = await DatabaseHandler.create({
          database,
          logger,
        });

        const routerOptions: RouterOptions = {
          ...options,
          databaseHandler,
          runtimes,
          queueFactories,
        };
        const renovateRunner = await RenovateRunner.from(routerOptions);

        await scheduleJobSync(renovateRunner, routerOptions);
        await scheduleCleanupTask(routerOptions);

        actionsRegistry.register({
          name: 'run-renovate',
          title: 'Run Renovate',
          description: `Run Renovate against a target repository to extract dependencies and generates a new report.
          The report consists of: 
          - a list of dependencies grouped by under 'packageFile' by manager (e.g. npm, pip, etc.) and their updates if available
          - a list of branches Renovate has created or would create and the updates the branch contain
          - a list of problems Renovate has detected while processing the repository
          - a record of libYearsWithStatus which contains the summarized age of dependencies grouped by their manager / ecosystem
          - a summary dependencyStatus which contains the number of dependencies and the number of outdated dependencies`,
          attributes: {},
          schema: {
            input: () => targetRepo,
            output: () => renovateReport,
          },
          action: async ({ input, logger: localLogger }) => {
            const report = await renovateRunner.renovate(
              {
                id: 'run-renovate',
                target: input,
              },
              localLogger,
            );
            return {
              output: report,
            };
          },
        });

        httpRouter.use(await createRouter(renovateRunner, routerOptions));
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
