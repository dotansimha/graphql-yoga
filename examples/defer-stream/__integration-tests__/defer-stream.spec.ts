import { yoga } from '../src/yoga';

describe('Defer / Stream', () => {
  it('stream', async () => {
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
    expect(responseText).toMatchSnapshot('stream');
  });
  it('defer', async () => {
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
    expect(responseText).toMatchSnapshot('defer');
  });
});
