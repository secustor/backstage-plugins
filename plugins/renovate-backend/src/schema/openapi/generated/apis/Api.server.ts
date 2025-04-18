//
//

// ******************************************************************
// * THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY. *
// ******************************************************************
import { DependenciesGet200Response } from '../models/DependenciesGet200Response.model';
import { ReportsDelete200Response } from '../models/ReportsDelete200Response.model';
import { ReportsGet200ResponseInner } from '../models/ReportsGet200ResponseInner.model';
import { RunsPost202Response } from '../models/RunsPost202Response.model';
import { RunsPost400Response } from '../models/RunsPost400Response.model';
import { RunsPostRequest } from '../models/RunsPostRequest.model';

/**
 * @public
 */
export type DependenciesGet = {
  query: {
    pageSize?: number;
    page?: number;
    availableValues?: boolean;
    datasource?: Array<string>;
    depName?: Array<string>;
    depType?: Array<string>;
    host?: Array<string>;
    latestOnly?: boolean;
    manager?: Array<string>;
    packageFile?: Array<string>;
    repository?: Array<string>;
  };
  response: DependenciesGet200Response | void;
};
/**
 * @public
 */
export type ReportsDelete = {
  query: {
    keepLatest?: number;
  };
  response: ReportsDelete200Response;
};
/**
 * @public
 */
export type ReportsGet = {
  response: Array<ReportsGet200ResponseInner>;
};
/**
 * @public
 */
export type ReportsHostDelete = {
  query: {
    keepLatest?: number;
  };
  response: ReportsDelete200Response;
};
/**
 * @public
 */
export type ReportsHostGet = {
  path: {
    host: string;
  };
  response: Array<ReportsGet200ResponseInner> | void;
};
/**
 * @public
 */
export type ReportsHostRepositoryDelete = {
  query: {
    keepLatest?: number;
  };
  response: ReportsDelete200Response;
};
/**
 * @public
 */
export type ReportsHostRepositoryGet = {
  path: {
    host: string;
    repository: string;
  };
  response: Array<ReportsGet200ResponseInner> | void;
};
/**
 * @public
 */
export type RunsPost = {
  body: RunsPostRequest;
  response: RunsPost202Response | RunsPost400Response;
};

export type EndpointMap = {
  '#get|/dependencies': DependenciesGet;

  '#_delete|/reports': ReportsDelete;

  '#get|/reports': ReportsGet;

  '#_delete|/reports/{host}': ReportsHostDelete;

  '#get|/reports/{host}': ReportsHostGet;

  '#_delete|/reports/{host}/{repository}': ReportsHostRepositoryDelete;

  '#get|/reports/{host}/{repository}': ReportsHostRepositoryGet;

  '#post|/runs': RunsPost;
};
