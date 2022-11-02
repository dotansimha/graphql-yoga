import { Plugin } from 'graphql-yoga'
import { GraphQLSchema, GraphQLDirective } from 'graphql'
import { GraphQLDeferDirective } from './directives/defer.js'
import { GraphQLStreamDirective } from './directives/stream.js'
import { DeferStreamDirectiveLabelRule } from './validations/defer-stream-directive-label.js'
import { DeferStreamDirectiveOnRootFieldRule } from './validations/defer-stream-directive-on-root-field.js'
import { OverlappingFieldsCanBeMergedRule } from './validations/overlapping-fields-can-be-merged.js'
import { StreamDirectiveOnListFieldRule } from './validations/stream-directive-on-list-field.js'

export function useDeferStream<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TPluginContext extends Record<string, any>,
>(): Plugin<TPluginContext> {
  return {
    onSchemaChange: ({ schema, replaceSchema }) => {
      const directives: GraphQLDirective[] = []

      if (schema.getDirective('defer') == null) {
        directives.push(GraphQLDeferDirective)
      }
      if (schema.getDirective('stream') == null) {
        directives.push(GraphQLStreamDirective)
      }
      replaceSchema(
        new GraphQLSchema({
          ...schema.toConfig(),
          directives: [...schema.getDirectives(), ...directives],
        }),
      )
    },
    onValidate: ({ addValidationRule }) => {
      addValidationRule(DeferStreamDirectiveLabelRule)
      addValidationRule(DeferStreamDirectiveOnRootFieldRule)
      addValidationRule(StreamDirectiveOnListFieldRule)
      // graphql-js older version without defer/stream do not account of overlapping with defer/stream
      addValidationRule(OverlappingFieldsCanBeMergedRule)
    },
  }
}
