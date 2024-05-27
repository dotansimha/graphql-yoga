import { createGraphQLError, getRootTypes } from '@graphql-tools/utils';
import { Plugin } from '@envelop/core';
import type { ValidationRule } from 'graphql/validation/ValidationContext';
import { isObjectType } from 'graphql';

export interface RootLevelQueryLimitOptions {
  maxRootLevelFields: number;
}

export function createRootLevelQueryLimitRule(opts: RootLevelQueryLimitOptions): ValidationRule {
  const { maxRootLevelFields } = opts;

  return function rootLevelQueryLimitRule (context) {
    const rootTypes = getRootTypes(context.getSchema());
    let rootFieldCount = 0;
    return {
      Field() {
        const parentType = context.getParentType();
        if (isObjectType(parentType) && rootTypes.has(parentType)) {
          rootFieldCount++;
          if (rootFieldCount > maxRootLevelFields) {
            throw createGraphQLError('Query is too complex.', {
              extensions: {
                http: {
                  spec: false,
                  status: 400,
                },
              },
            });
          }
        }
      },
    };
  };

}

export function rootLevelQueryLimit(opts: RootLevelQueryLimitOptions): Plugin {
  const rootLevelQueryLimitRule = createRootLevelQueryLimitRule(opts);
  return {
    onValidate({ addValidationRule }) {
      addValidationRule(
        rootLevelQueryLimitRule
      )
    }
  }
}
