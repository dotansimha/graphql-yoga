import { buildService, gateway } from '../gateway/src/gateway'
import { yoga as service1 } from '../service/src/yoga'
import { createServer, Server } from 'http'
import { AddressInfo } from 'net'
import { fetch, File, FormData } from '@whatwg-node/fetch'

describe('apollo-federation example integration', () => {
  let gatewayServer: Server
  let serviceServer: Server
  let gatewayPort: number
  let servicePort: number

  beforeAll(async () => {
    serviceServer = createServer(service1)
    await new Promise<void>((resolve) => serviceServer.listen(0, resolve))
    servicePort = (serviceServer.address() as AddressInfo).port

    const gatewayService = await gateway({
      serviceList: [
        { name: 'accounts', url: `http://localhost:${servicePort}/graphql` },
      ],
      buildService,
    })
    gatewayServer = createServer(gatewayService)
    await new Promise<void>((resolve) => gatewayServer.listen(0, resolve))
    gatewayPort = (gatewayServer.address() as AddressInfo).port
  })

  afterAll(async () => {
    await new Promise((resolve) => gatewayServer.close(resolve))
    await new Promise((resolve) => serviceServer.close(resolve))
  })

  it('should execute field on subgraph', async () => {
    const response = await fetch(
      `http://localhost:${gatewayPort}/graphql?query=query{me { id }}`,
    )
    const body = await response.json()
    expect(body.errors).toBeUndefined()
    expect(body.data).toEqual({
      me: {
        id: '1',
      },
    })
  })
  it('should forward file uploads', async () => {
    const formData = new FormData()
    formData.append(
      'operations',
      JSON.stringify({
        query: 'query($file: File!){readTextFile(file: $file)}',
        variables: {
          file: null,
        },
      }),
    )
    formData.append(
      'map',
      JSON.stringify({
        0: ['variables.file'],
      }),
    )
    formData.append(
      '0',
      new File(['test'], 'test.txt', {
        type: 'text/plain',
      }),
    )
    const response = await fetch(`http://localhost:${gatewayPort}/graphql`, {
      method: 'POST',
      body: formData,
    })
    const body = await response.json()
    expect(body.errors).toBeUndefined()
    expect(body.data).toEqual({
      readTextFile: 'test',
    })
  })
})
