/// <reference types="express" />
import * as express from 'express';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { GraphQLSchema } from 'graphql';
export { PubSub, withFilter } from 'graphql-subscriptions';
import { Props, Options } from './types';
export { Options, express };
export declare class GraphQLServer {
    express: express.Application;
    subscriptionServer: SubscriptionServer | null;
    options: Options;
    executableSchema: GraphQLSchema;
    private context;
    private formatError;
    private formatParams;
    private formatResponse;
    private logFunction;
    constructor(props: Props);
    start(callback?: (() => void)): Promise<void>;
}
