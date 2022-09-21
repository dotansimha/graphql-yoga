import { OpenAPI, useSofa } from 'sofa-api'

export type SofaHandler = ReturnType<typeof useSofa>
export type OpenAPIInstance = ReturnType<typeof OpenAPI>
