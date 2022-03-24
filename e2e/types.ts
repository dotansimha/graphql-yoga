import { OutputValue, Stack } from '@pulumi/pulumi/automation'

export type DeploymentConfiguration<TProgramOutput = {}> = {
  prerequisites: (stack: Stack) => Promise<void>
  config: (stack: Stack) => Promise<void>
  program: () => Promise<TProgramOutput>
  test: (output: {
    [K in keyof TProgramOutput]: Pick<OutputValue, 'secret'> & {
      value: TProgramOutput[K]
    }
  }) => Promise<void>
}
