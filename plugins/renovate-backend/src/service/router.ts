import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import { createOpenApiRouter } from '../schema/openapi.generated';
import { renovateRepository } from '../wrapper';
import { runRequestBody } from './schema';
import fetch from 'node-fetch';
import { nanoid } from 'nanoid';
import type { RouterOptions } from './types';
import { DatabaseHandler } from './databaseHandler';
import { getTargetURL, parseUrl } from './utils';
import { TargetRepo } from '../wrapper/types';

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger } = options;

  const dbHandler = await DatabaseHandler.create(options);

  const router = await createOpenApiRouter();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.debug('healthcheck request');
    response.json('ok');
  });

  router.get('/reports', async (_request, response) => {
    const reports = await dbHandler.getReports(options);
    response.status(200).json(reports);
  });

  router.post('/run', async (request, response) => {
    const body = runRequestBody.safeParse(request.body);
    if (!body.success) {
      response.status(400).json({ error: body.error });
      return;
    }
    const data = body.data;

    const runID = nanoid();
    const ctx = {
      ...options,
      runID,
    };

    // trigger Renovate run
    const targetUrl = getTargetURL(data.target);
    const targetRepo: TargetRepo = {
      host: targetUrl.resource,
      repository: targetUrl.full_name,
    };
    const promise = renovateRepository(targetRepo, ctx);

    promise.then(async report => dbHandler.addReport(report, targetRepo, ctx));

    // in case of a callBackURL, set up a completion message
    const parsedUrl = parseUrl(data.callBackURL);
    if (parsedUrl) {
      // if allowedHosts are defined, check if callBackUrl is in the list
      const allowedHosts = options.rootConfig.getOptionalStringArray(
        'callBacks.allowedHosts',
      );
      if (allowedHosts && !allowedHosts.includes(parsedUrl.host)) {
        response.status(400).json({
          error: `callBackUrl '${parsedUrl.host}' is not in allowedHosts list`,
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

    response.status(202).json({ runID });
  });
  router.use(errorHandler());
  return router;
}
