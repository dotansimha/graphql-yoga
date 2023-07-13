import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import { fetch, File, FormData } from '@whatwg-node/fetch';
import { createSchema, createYoga } from '../src';

function md5File(path: string) {
  return new Promise((resolve, reject) => {
    const output = crypto.createHash('md5');
    const input = fs.createReadStream(path);

    input.on('error', err => {
      reject(err);
    });

    output.once('readable', () => {
      resolve(output.read().toString('hex'));
    });

    input.pipe(output);
  });
}

describe('file uploads', () => {
  it('uploading and streaming a binary file succeeds', async () => {
    const sourceFilePath = path.join(__dirname, '..', '..', '..', 'website', 'public', 'logo.png');
    const sourceMd5 = await md5File(sourceFilePath);
    const id = crypto.randomBytes(20).toString('hex');
    const targetFilePath = path.join(os.tmpdir(), `${id}.png`);

    const yoga = createYoga({
      schema: createSchema({
        resolvers: {
          Mutation: {
            uploadFile: async (root, args) => {
              await fs.promises.writeFile(
                targetFilePath,
                Buffer.from(await args.file.arrayBuffer()),
              );
              return true;
            },
          },
        },
        typeDefs: /* GraphQL */ `
          scalar File

          type Query {
            _: Boolean
          }
          type Mutation {
            uploadFile(file: File!): Boolean
          }
        `,
      }),
      logging: false,
    });
    const server = createServer(yoga);

    try {
      await new Promise<void>(resolve => server.listen(0, resolve));
      const port = (server.address() as AddressInfo).port;

      const formData = new FormData();
      formData.set(
        'operations',
        JSON.stringify({
          query: /* GraphQL */ `
            mutation uploadFile($file: File!) {
              uploadFile(file: $file)
            }
          `,
        }),
      );
      formData.set('map', JSON.stringify({ 0: ['variables.file'] }));
      formData.set(
        '0',
        new File([await fs.promises.readFile(sourceFilePath)], path.basename(sourceFilePath), {
          type: 'image/png',
        }),
      );

      const response = await fetch(`http://localhost:${port}/graphql`, {
        method: 'POST',
        body: formData,
      });

      const body = await response.json();
      expect(body.errors).toBeUndefined();
      expect(body.data).toEqual({
        uploadFile: true,
      });

      await fs.promises.stat(targetFilePath);
      const targetMd5 = await md5File(targetFilePath);
      expect(targetMd5).toEqual(sourceMd5);
      fs.promises.unlink(targetFilePath);
      expect(targetMd5).toBe(sourceMd5);
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });
});
