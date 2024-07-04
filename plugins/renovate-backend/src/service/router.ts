import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import express from 'express';
import { createOpenApiRouter } from '../schema/openapi.generated';
import { runRequestBody } from './schema';
import type { RouterOptions } from './types';
import {
  getTargetRepo,
  getTaskID,
  isEntityRef,
} from '@secustor/backstage-plugin-renovate-common';
import { RenovateRunner } from '../wrapper';
import { CatalogClient } from '@backstage/catalog-client';
import type { Entity } from '@backstage/catalog-model';

export async function createRouter(
  runner: RenovateRunner,
  options: RouterOptions,
): Promise<express.Router> {
  const {
    auth,
    rootConfig: config,
    logger,
    databaseHandler,
    discovery,
  } = options;

  const middlewareFactory = MiddlewareFactory.create({ logger, config });

  const client = new CatalogClient({ discoveryApi: discovery });

  const router = await createOpenApiRouter();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.debug('healthcheck request');
    response.json('ok');
  });

  router.get('/reports', async (_request, response) => {
    const reports = await databaseHandler.getReports();
    response.status(200).json(reports);
  });

  router.delete('/reports', async (request, response) => {
    const modified = await databaseHandler.deleteReports({
      keepLatest: request.query.keepLatest,
    });
    response.status(200).json({ modified });
  });

  router.get('/reports/:host', async (request, response) => {
    const reports = await databaseHandler.getReports({
      ...request.params,
    });
    response.status(200).json(reports);
  });

  router.delete('/reports/:host', async (request, response) => {
    const modified = await databaseHandler.deleteReportsByTarget(
      request.params,
      { keepLatest: request.query.keepLatest },
    );
    response.status(200).json({ modified });
  });

  router.get('/reports/:host/:repository', async (request, response) => {
    const reports = await databaseHandler.getReports({
      ...request.params,
    });
    response.status(200).json(reports);
  });

  router.delete('/reports/:host/:repository', async (request, response) => {
    const modified = await databaseHandler.deleteReportsByTarget(
      request.params,
      { keepLatest: request.query.keepLatest },
    );
    response.status(200).json({ modified });
  });

  router.post('/runs', async (request, response) => {
    const body = runRequestBody.safeParse(request.body);
    if (!body.success) {
      response.status(400).json({ error: body.error });
      return;
    }
    let target: string | Entity = body.data.target;

    // check if we got an entity ref and if yes get the entity
    if (isEntityRef(target)) {
      const { token } = await auth.getPluginRequestToken({
        onBehalfOf: await auth.getOwnServiceCredentials(),
        targetPluginId: 'catalog',
      });
      const result = await client.getEntityByRef(target, { token });
      if (result) {
        target = result;
      }
    }

    // trigger Renovate run
    const targetRepo = getTargetRepo(target);
    const id = getTaskID(targetRepo);
    const result = await runner.runNext(targetRepo);
    if (result.status === 'already-running') {
      logger.debug('Task already running', { taskID: id });
      response.status(423).json({ error: 'Task is already running' });
      return;
    }
    response.status(202).json({ runID: id });
  });
  router.use(middlewareFactory.error());
  return router;
}
