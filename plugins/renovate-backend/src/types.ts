import {RouterOptions} from "./service/types";

export interface Context extends RouterOptions{
  runtime?: 'direct';
  runID: string;
}

export interface Report {
  // TODO do not use any
  branches: any;
  packageFiles: any;
}
