import { ExecutorLink } from '@graphql-tools/executor-apollo-link'
import {
  HTTPExecutorOptions,
  buildHTTPExecutor,
} from '@graphql-tools/executor-http'

export type YogaLinkOptions = HTTPExecutorOptions

export class YogaLink extends ExecutorLink {
  constructor(options: YogaLinkOptions) {
    super(buildHTTPExecutor(options as any))
  }
}
