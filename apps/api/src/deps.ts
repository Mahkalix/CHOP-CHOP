import type { preHandlerAsyncHookHandler } from "fastify";
import type { Repository } from "./repository.js";

export interface RouteDeps {
  repository: Repository;
  requireAuth: preHandlerAsyncHookHandler;
  now: () => Date;
}
