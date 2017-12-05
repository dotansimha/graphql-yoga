/// <reference types="express" />
import * as express from 'express';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { GraphQLSchema } from 'graphql';
export { PubSub } from 'graphql-subscriptions';
import { Props, Options } from './types';
export { Options, express };
export declare class GraphQLServer {
    express: express.Application;
    subscriptionServer: SubscriptionServer | null;
    schema: GraphQLSchema;
    private context;
    private formatError;
    private formatParams;
    private formatResponse;
    private logFunction;
    private options;
    constructor(props: Props);
    start(callback?: (() => void)): Promise<void>;
}
