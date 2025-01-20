import { NoSchemaIntrospectionCustomRule } from 'graphql';
import type { Plugin, PromiseOrValue } from 'graphql-yoga';

type UseDisableIntrospectionArgs = {
  isDisabled?: (request: Request, context: Record<string, unknown>) => PromiseOrValue<boolean>;
};

export function useDisableIntrospection<TContext extends Record<string, unknown>>(
  props?: UseDisableIntrospectionArgs,
): Plugin<TContext> {
  const store = new WeakMap<Request, boolean>();
  return {
    async onRequestParse({ request, serverContext }) {
      const isDisabled = props?.isDisabled ? await props.isDisabled(request, serverContext) : true;
      store.set(request, isDisabled);
    },
    onValidate({ addValidationRule, context }) {
      const isDisabled = store.get(context.request) ?? true;
      if (isDisabled) {
        addValidationRule(NoSchemaIntrospectionCustomRule);
      }
    },
  };
}
