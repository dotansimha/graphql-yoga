import { DeploymentConfiguration } from '../types'
import {
  assertGraphiQL,
  assertQuery,
  execPromise,
  waitForEndpoint,
} from '../utils'
import * as docker from '@pulumi/docker'
import { interpolate } from '@pulumi/pulumi'
import { resolve } from 'path'

export const nextJSDeployment = (
  image: string,
): DeploymentConfiguration<{
  endpoint: string
}> => ({
  prerequisites: async () => {
    await execPromise('pnpm build', {
      cwd: '../examples/nextjs-app',
    })
  },
  program: async () => {
    const remoteImage = new docker.RemoteImage('node-image', {
      name: image,
      keepLocally: true,
    })

    const container = new docker.Container('container', {
      image: remoteImage.repoDigest,
      command: [`./node_modules/.bin/next`, 'start'],
      volumes: [
        {
          containerPath: '/app',
          hostPath: resolve('../'),
        },
      ],
      workingDir: '/app/examples/nextjs-app',
      ports: [
        {
          internal: 3000,
        },
      ],
    })

    // Since the provider picked a random ephemeral port for this container, export the endpoint.
    const endpoint = container.ports.apply(
      (ports) => `localhost:${ports![0].external}`,
    )

    return {
      endpoint: interpolate`http://${endpoint}/api/graphql`,
    }
  },
  test: async ({ endpoint }) => {
    console.log(`ℹ️ Docker container deployed to URL: ${endpoint.value}`)
    await waitForEndpoint(endpoint.value, 5, 10000)
    await assertGraphiQL(endpoint.value)
    await assertQuery(endpoint.value)
  },
})
