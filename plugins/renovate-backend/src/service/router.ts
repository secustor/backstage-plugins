import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import express from 'express';
import { createOpenApiRouter } from '../schema/openapi.generated';
import { runRequestBody } from './schema';
import { DependenciesFilter, RouterOptions } from './types';
import {
  getTargetRepo,
  getTaskID,
  isEntityRef,
  TargetRepo,
} from '@secustor/backstage-plugin-renovate-common';
import { RenovateRunner } from '../wrapper';
import { CatalogClient } from '@backstage/catalog-client';
import type { Entity } from '@backstage/catalog-model';
import is from '@sindresorhus/is';
import { getFileUrl } from '../wrapper/platforms';

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

  router.get('/dependencies', async (request, response) => {
    const filter: DependenciesFilter = request.query;
    const dependencies = await databaseHandler.getDependencies(filter);

    const massaged = dependencies.map(dep => {
      return {
        ...dep,
        id: dep.id!,
        runID: dep.run_id,
        extractionTimestamp: dep.extractionTimestamp?.toISOString(),
        currentVersionTimestamp: dep.currentVersionTimestamp?.toISOString(),
        packageFileUrl: getFileUrl(dep) ?? undefined,
      };
    });

    let availableValues: Record<string, string[]> | undefined;
    if (request.query.availableValues) {
      availableValues = await databaseHandler.getDependenciesValues(filter);
    }

    // openapi gen expects an empty array
    response.json({
      dependencies: massaged,
      availableValues,
    });
  });

  router.post('/runs', async (request, response) => {
    const body = runRequestBody.safeParse(request.body);
    if (!body.success) {
      response.status(400).json({ error: body.error.toString() });
      return;
    }
    let target: string | TargetRepo | Entity = body.data.target;

    // check if we got an entity ref and if yes get the entity
    if (is.string(target) && isEntityRef(target)) {
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
    response.status(202).json({ taskID: id });
  });
  router.use(middlewareFactory.error());
  return router;
}
