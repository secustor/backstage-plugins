import { RenovateWrapper } from './types';
import { Direct } from './direct';

export const api: Map<string, RenovateWrapper> = new Map();

api.set('direct', new Direct());
