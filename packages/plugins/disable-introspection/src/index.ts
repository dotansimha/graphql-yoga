import { NoSchemaIntrospectionCustomRule } from 'graphql';
import type { Plugin, PromiseOrValue } from 'graphql-yoga';
import { handleMaybePromise } from '@whatwg-node/promise-helpers';

type UseDisableIntrospectionArgs = {
  isDisabled?: (request: Request, context: Record<string, unknown>) => PromiseOrValue<boolean>;
};

export function useDisableIntrospection<TContext extends Record<string, unknown>>(
  props?: UseDisableIntrospectionArgs,
): Plugin<TContext> {
  const store = new WeakMap<Request, boolean>();
  return {
    onRequestParse({ request, serverContext }) {
      return handleMaybePromise(
        () => (props?.isDisabled ? props.isDisabled(request, serverContext) : true),
        () => {
          store.set(request, true);
        },
      );
    },
    onValidate({ addValidationRule, context }) {
      const isDisabled = store.get(context.request) ?? true;
      if (isDisabled) {
        addValidationRule(NoSchemaIntrospectionCustomRule);
      }
    },
  };
}
