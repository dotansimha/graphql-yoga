## Yoga e2e testing

This project contains everything related to e2e testing for GraphQL-Yoga.

In order to ensure that GraphQL-Yoga is compatible with all popular runtimes.

To do that, we are using [Pulumi](https://www.pulumi.com/) (infrastructure-as-code) (with TypeScript, and using [Automation API](https://www.pulumi.com/docs/guides/automation-api/)) to provision a real resource in every env, run smoke tests (`GET -> GraphiQL`, `POST -> Execute GraphQL`), and then destroy and remove all resources.

On each PR, this workflow runs, and tried to deploy and test an actual environment. This way we can find issues like compatibility issues / runtime issues during code reviews.

### Tested Enrivonments

- [x] [CloudFlare Worker](./tests/cf-worker.ts)
- [x] [Azure Function](./tests/azure-function.ts)
- [x] [AWS Lambda](./tests/aws-lambda.ts)
- [x] [Docker container](./tests/docker.ts)
- [x] [Vercel Function](./tests/vercel.ts)
- [x] [Vercel Edge Function](./tests/vercel-edge.ts)
- [ ] K8s Pod
- [ ] Docker

### Notes

- This check runs on every PR created to GraphQL-Yoga repo.
- We are using the locally built version of Yoga - so all functions are deployed as built artifact (using `esbuild`).
