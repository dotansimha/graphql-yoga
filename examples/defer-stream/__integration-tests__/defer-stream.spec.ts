import { yoga } from '../src/yoga';

describe('Defer / Stream', () => {
  it('stream', async () => {
    const start = Date.now();
    const response = await yoga.fetch('/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/graphql-response+json, application/json, multipart/mixed',
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          query StreamAlphabet {
            alphabet(waitFor: 100) @stream
          }
        `,
      }),
    });
    expect(response.status).toEqual(200);
    const contentType = response.headers.get('Content-Type');
    expect(contentType).toEqual('multipart/mixed; boundary="-"');
    const responseText = await response.text();
    const end = Date.now();
    expect(responseText).toMatchSnapshot('stream');
    const diff = end - start;
    expect(diff).toBeLessThan(2650);
    expect(diff > 2550).toBeTruthy();
  });
  it('defer', async () => {
    const start = Date.now();
    const response = await yoga.fetch('/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/graphql-response+json, application/json, multipart/mixed',
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          query SlowAndFastFieldWithDefer {
            ... on Query @defer {
              slowField(waitFor: 1500)
            }
            fastField
          }
        `,
      }),
    });
    expect(response.status).toEqual(200);
    const contentType = response.headers.get('Content-Type');
    expect(contentType).toEqual('multipart/mixed; boundary="-"');
    const responseText = await response.text();
    const end = Date.now();
    expect(responseText).toMatchSnapshot('defer');
    const diff = end - start;
    expect(diff).toBeLessThan(1600);
    expect(diff > 1450).toBeTruthy();
  });
});
