import type { Plugin } from './types';

/**
 * Enables experimental support for request cancelation.
 */
export function useExecutionCancelation(): Plugin {
  return {
    onExecute({ args }) {
      // @ts-expect-error we don't have this typing in envelop
      args.signal = args.contextValue?.request?.signal ?? undefined;
    },
    onSubscribe({ args }) {
      // @ts-expect-error we don't have this typing in envelop
      args.signal = args.contextValue?.request?.signal ?? undefined;
    },
  };
}
