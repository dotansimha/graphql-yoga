#!/usr/bin/env node
import * as cdk from '@aws-cdk/core'
import 'source-map-support/register'

import { GraphqlLambdaStack } from '../lib/graphql-lambda-stack.js'

const app = new cdk.App()
new GraphqlLambdaStack(app, 'GraphqlLambdaStack')
