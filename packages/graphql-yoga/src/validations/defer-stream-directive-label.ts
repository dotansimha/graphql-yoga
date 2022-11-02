import { Kind, ASTVisitor, ValidationContext } from 'graphql'
import { createGraphQLError } from '../error.js'
import { GraphQLDeferDirective } from '../directives/defer.js'
import { GraphQLStreamDirective } from '../directives/stream.js'

/**
 * Stream directive on list field
 *
 * A GraphQL document is only valid if defer and stream directives' label argument is static and unique.
 */
export function DeferStreamDirectiveLabelRule(
  context: ValidationContext,
): ASTVisitor {
  const knownLabels = Object.create(null)
  return {
    Directive(node) {
      if (
        node.name.value === GraphQLDeferDirective.name ||
        node.name.value === GraphQLStreamDirective.name
      ) {
        const labelArgument = node.arguments?.find(
          (arg) => arg.name.value === 'label',
        )
        const labelValue = labelArgument?.value
        if (!labelValue) {
          return
        }
        if (labelValue.kind !== Kind.STRING) {
          context.reportError(
            createGraphQLError(
              `Directive "${node.name.value}"'s label argument must be a static string.`,
              { nodes: node },
            ),
          )
        } else if (knownLabels[labelValue.value]) {
          context.reportError(
            createGraphQLError(
              'Defer/Stream directive label argument must be unique.',
              { nodes: [knownLabels[labelValue.value], node] },
            ),
          )
        } else {
          knownLabels[labelValue.value] = node
        }
      }
    },
  }
}
