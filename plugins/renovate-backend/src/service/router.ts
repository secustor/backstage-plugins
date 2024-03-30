import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import { createOpenApiRouter } from '../schema/openapi.generated';
import { runRequestBody } from './schema';
import fetch from 'node-fetch';
import type { RouterOptions } from './types';
import {
  getTargetRepo,
  getTaskID,
  parseUrl,
  type TargetRepo,
} from '@secustor/plugin-renovate-common';
import { RenovateRunner } from '../wrapper';

export async function createRouter(
  runner: RenovateRunner,
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, pluginConfig, databaseHandler } = options;

  const router = await createOpenApiRouter();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.debug('healthcheck request');
    response.json('ok');
  });

  router.get('/reports', async (request, response) => {
    let target: TargetRepo | undefined;

    if (request.body?.target) {
      target = getTargetRepo(request.body?.target);
    }
    const reports = await databaseHandler.getReports(target);
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
    const promise = runner.schedule(targetRepo);

    // in case of a callBackURL, set up a completion message
    const parsedUrl = parseUrl(data.callBackURL);
    if (parsedUrl) {
      // if allowedHosts are defined, check if callBackUrl is in the list
      const allowedHosts = pluginConfig.getOptionalStringArray(
        'callBacks.allowedHosts',
      );
      if (
        // by default, allow only localhost
        (!allowedHosts && parsedUrl.host !== 'localhost') ||
        // else check if host is in the allowed list
        (allowedHosts && !allowedHosts.includes(parsedUrl.host))
      ) {
        response.status(400).json({
          error: `callBackUrl '${parsedUrl.host}' is not allowed`,
        });
        return;
      }

      promise.then(report => {
        fetch(data.callBackURL!, {
          method: 'POST',
          body: JSON.stringify(report),
        });
      });

      promise.catch(reason => {
        fetch(data.callBackURL!, {
          method: 'POST',
          body: JSON.stringify(reason),
        });
      });
    }

    response.status(202).json({ runID: getTaskID(targetRepo) });
  });
  router.use(errorHandler());
  return router;
}
