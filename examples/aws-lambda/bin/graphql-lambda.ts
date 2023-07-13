#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { GraphqlLambdaStack } from '../lib/graphql-lambda-stack.js';

const app = new cdk.App();
new GraphqlLambdaStack(app, 'GraphqlLambdaStack');
