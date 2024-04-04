import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import { createOpenApiRouter } from '../schema/openapi.generated';
import { runRequestBody } from './schema';
import type { RouterOptions } from './types';
import {
  getTargetRepo,
  getTaskID,
} from '@secustor/backstage-plugin-renovate-common';
import { RenovateRunner } from '../wrapper';
import { ConflictError, isError } from '@backstage/errors';

export async function createRouter(
  runner: RenovateRunner,
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, databaseHandler } = options;

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

  router.get('/reports/:host', async (request, response) => {
    const reports = await databaseHandler.getReports({
      ...request.params,
    });
    response.status(200).json(reports);
  });

  router.get('/reports/:host/:repository', async (request, response) => {
    const reports = await databaseHandler.getReports({
      ...request.params,
    });
    response.status(200).json(reports);
  });

  router.post('/runs', async (request, response) => {
    const body = runRequestBody.safeParse(request.body);
    if (!body.success) {
      response.status(400).json({ error: body.error });
      return;
    }
    const data = body.data;

    // trigger Renovate run
    const targetRepo = getTargetRepo(data.target);
    const id = getTaskID(targetRepo);
    try {
      await runner.trigger(targetRepo);
      response.status(202).json({ runID: id });
    } catch (e) {
      if (isError(e) && ConflictError.name === e.name) {
        logger.debug('Task already running', { taskID: id });
        response.status(423).json({ error: e });
      } else {
        response.status(400).json({ error: e });
      }
    }
  });
  router.use(errorHandler());
  return router;
}
