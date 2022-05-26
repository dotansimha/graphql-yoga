import { IntrospectionObjectType, IntrospectionSchema } from 'graphql'

export function getQuery(
  introspectionSchema: IntrospectionSchema,
): IntrospectionObjectType {
  return introspectionSchema.types.find(
    (item) => item.name === introspectionSchema.queryType.name,
  ) as IntrospectionObjectType
}

export function getMutation(
  introspectionSchema: IntrospectionSchema,
): IntrospectionObjectType {
  return introspectionSchema.types.find(
    (item) => item.name === introspectionSchema.mutationType.name,
  ) as IntrospectionObjectType
}

export function getSubscription(
  introspectionSchema: IntrospectionSchema,
): IntrospectionObjectType {
  return introspectionSchema.types.find(
    (item) => item.name === introspectionSchema.subscriptionType.name,
  ) as IntrospectionObjectType
}

export function getQueryByName(
  introspectionSchema: IntrospectionSchema,
  name: string,
) {
  const queryType = getQuery(introspectionSchema)
  return queryType.fields.find((item) => item.name === name)
}

export function getMutationByName(
  introspectionSchema: IntrospectionSchema,
  name: string,
) {
  const mutationType = getMutation(introspectionSchema)
  return mutationType.fields.find((item) => item.name === name)
}

export function getSubscriptionByName(
  introspectionSchema: IntrospectionSchema,
  name: string,
) {
  const subscriptionType = getSubscription(introspectionSchema)
  return subscriptionType.fields.find((item) => item.name === name)
}
