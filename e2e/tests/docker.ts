import { DeploymentConfiguration } from '../types'
import {
  assertGraphiQL,
  assertQuery,
  execPromise,
  waitForEndpoint,
} from '../utils'
import * as docker from '@pulumi/docker'
import { interpolate } from '@pulumi/pulumi'
import { resolve } from 'node:path'

export const dockerDeployment = (
  image: string,
): DeploymentConfiguration<{
  endpoint: string
}> => ({
  prerequisites: async () => {
    await execPromise('pnpm build', {
      cwd: '../examples/node-ts',
    })
  },
  program: async () => {
    const remoteImage = new docker.RemoteImage('node-image', {
      name: image,
      keepLocally: true,
    })

    const container = new docker.Container('container', {
      image: remoteImage.repoDigest,
      command: [`node`, 'index.js'],
      volumes: [
        {
          containerPath: '/app',
          hostPath: resolve('../examples/node-ts/dist'),
        },
      ],
      workingDir: '/app',
      ports: [
        {
          internal: 4000,
        },
      ],
    })

    // Since the provider picked a random ephemeral port for this container, export the endpoint.
    const endpoint = container.ports.apply(
      (ports) => `localhost:${ports![0].external}`,
    )

    return {
      endpoint: interpolate`http://${endpoint}/graphql`,
    }
  },
  test: async ({ endpoint }) => {
    console.log(`ℹ️ Docker container deployed to URL: ${endpoint.value}`)
    await waitForEndpoint(endpoint.value, 5, 10000)
    await assertGraphiQL(endpoint.value)
    await assertQuery(endpoint.value)
  },
})
