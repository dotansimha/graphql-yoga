import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { GatewayConfig, IntrospectAndCompose } from '@apollo/gateway';
import { fetch } from '@whatwg-node/fetch';
import { gateway } from '../gateway/gateway';
import { yoga as service1 } from '../service/yoga';

describe('apollo-federation example integration', () => {
  let gatewayServer: Server;
  let serviceServer: Server;
  let gatewayPort: number;
  let servicePort: number;

  beforeAll(async () => {
    serviceServer = createServer(service1);
    await new Promise<void>(resolve => serviceServer.listen(0, resolve));
    servicePort = (serviceServer.address() as AddressInfo).port;

    const gatewayConfig: GatewayConfig = {
      supergraphSdl: new IntrospectAndCompose({
        subgraphs: [{ name: 'accounts', url: `http://localhost:${servicePort}/graphql` }],
      }),
    };

    const gatewayService = await gateway(gatewayConfig);
    gatewayServer = createServer(gatewayService);
    await new Promise<void>(resolve => gatewayServer.listen(0, resolve));
    gatewayPort = (gatewayServer.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise(resolve => gatewayServer?.close(resolve));
    await new Promise(resolve => serviceServer?.close(resolve));
  });

  it('should execute field on subgraph', async () => {
    const response = await fetch(`http://localhost:${gatewayPort}/graphql?query=query{me { id }}`);
    const body = await response.json();
    expect(body.errors).toBeUndefined();
    expect(body.data).toEqual({
      me: {
        id: '1',
      },
    });
  });

  it('pass through errors', async () => {
    const response = await fetch(`http://localhost:${gatewayPort}/graphql?query=query{throw}`);
    const body = await response.json();
    expect(body).toMatchInlineSnapshot(`
      {
        "data": {
          "throw": null,
        },
        "errors": [
          {
            "extensions": {
              "code": "DOWNSTREAM_SERVICE_ERROR",
              "serviceName": "accounts",
            },
            "message": "This should throw.",
            "path": [
              "throw",
            ],
          },
        ],
      }
    `);
  });
});
