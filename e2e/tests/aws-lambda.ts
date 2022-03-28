import { Stack } from '@pulumi/pulumi/automation'
import { DeploymentConfiguration } from '../types'
import { assertGraphiQL, assertQuery, env } from '../utils'
import * as pulumi from '@pulumi/pulumi'
import { execSync } from 'child_process'
import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'

export const awsLambdaDeployment: DeploymentConfiguration<{
  functionUrl: string
}> = {
  prerequisites: async (stack: Stack) => {
    // Build and bundle the worker
    console.info('\t\tℹ️ Bundling the AWS Lambda Function....')
    execSync('yarn build', {
      cwd: '../examples/aws-lambda-bundle',
      stdio: 'inherit',
    })
  },
  config: async (stack: Stack) => {
    // Configure the Pulumi environment with the Azure credentials
    // This will allow Pulummi program to just run without caring about secrets/configs.
    // See: https://www.pulumi.com/registry/packages/aws-native/installation-configuration/
    await stack.setConfig('aws-native:accessKey', {
      value: env('AWS_ACCESS_KEY'),
    })
    await stack.setConfig('aws-native:secretKey', {
      value: env('AWS_SECRET_KEY'),
    })
    await stack.setConfig('aws-native:region', {
      value: env('AWS_REGION'),
    })
    await stack.setConfig('aws:accessKey', {
      value: env('AWS_ACCESS_KEY'),
    })
    await stack.setConfig('aws:secretKey', {
      value: env('AWS_SECRET_KEY'),
    })
    await stack.setConfig('aws:region', {
      value: env('AWS_REGION'),
    })
    await stack.setConfig('aws:allowedAccountIds', {
      value: `[${env('AWS_ACCOUNT_ID')}]`,
    })
  },
  program: async () => {
    const stackName = pulumi.getStack()
    const lambdaRole = new aws.iam.Role('lambda-role', {
      assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: 'lambda.amazonaws.com',
      }),
    })

    const lambdaRolePolicy = new aws.iam.RolePolicy('role-policy', {
      role: lambdaRole.id,
      policy: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
        ],
      },
    })

    const func = new aws.lambda.Function(
      'func',
      {
        role: lambdaRole.arn,
        runtime: 'nodejs14.x',
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.FileAsset(
            '../examples/aws-lambda-bundle/dist/index.js',
          ),
        }),
      },
      { dependsOn: lambdaRolePolicy },
    )

    const lambdaGw = new awsx.apigateway.API('api', {
      routes: [
        {
          path: '/',
          method: 'GET',
          eventHandler: func,
        },
        {
          path: '/',
          method: 'POST',
          eventHandler: func,
        },
      ],
    })

    return {
      functionUrl: lambdaGw.url,
    }
  },
  test: async ({ functionUrl }) => {
    console.log(`ℹ️ AWS Lambda Function deployed to URL: ${functionUrl.value}`)
    // await assertGraphiQL(functionUrl.value)
    // await assertQuery(functionUrl.value)
  },
}
