"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
exports.express = express;
var bodyParser = require("body-parser");
var cors = require("cors");
var graphql_playground_middleware_express_1 = require("graphql-playground-middleware-express");
var subscriptions_transport_ws_1 = require("subscriptions-transport-ws");
var http_1 = require("http");
var graphql_1 = require("graphql");
var apollo_upload_server_1 = require("apollo-upload-server");
var apollo_server_express_1 = require("apollo-server-express");
var graphql_tools_1 = require("graphql-tools");
var graphql_subscriptions_1 = require("graphql-subscriptions");
exports.PubSub = graphql_subscriptions_1.PubSub;
var GraphQLServer = /** @class */ (function () {
    function GraphQLServer(props) {
        var defaultOptions = {
            disableSubscriptions: false,
            tracing: { mode: 'http-header' },
            port: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
            endpoint: '/',
            subscriptionsEndpoint: '/',
            playgroundEndpoint: '/',
            disablePlayground: false,
        };
        this.options = __assign({}, defaultOptions, props.options);
        this.express = express();
        this.subscriptionServer = null;
        this.context = props.context;
        this.formatError = props.formatError;
        this.formatParams = props.formatParams;
        this.formatResponse = props.formatResponse;
        this.logFunction = props.logFunction;
        if (props.schema) {
            this.schema = props.schema;
        }
        else {
            var typeDefs = props.typeDefs, resolvers = props.resolvers;
            var uploadMixin = typeDefs.includes('scalar Upload')
                ? { Upload: apollo_upload_server_1.GraphQLUpload }
                : {};
            this.schema = graphql_tools_1.makeExecutableSchema({
                typeDefs: typeDefs,
                resolvers: __assign({}, uploadMixin, resolvers),
            });
        }
    }
    GraphQLServer.prototype.start = function (callback) {
        var _this = this;
        if (callback === void 0) { callback = function () { return null; }; }
        var app = this.express;
        var _a = this.options, port = _a.port, endpoint = _a.endpoint, disablePlayground = _a.disablePlayground, disableSubscriptions = _a.disableSubscriptions, playgroundEndpoint = _a.playgroundEndpoint, subscriptionsEndpoint = _a.subscriptionsEndpoint, uploads = _a.uploads;
        // CORS support
        if (this.options.cors) {
            app.use(cors(this.options.cors));
        }
        else if (this.options.cors !== false) {
            app.use(cors());
        }
        var tracing = function (req) {
            var t = _this.options.tracing;
            if (typeof t === 'boolean') {
                return t;
            }
            else if (t.mode === 'http-header') {
                return req.get('x-apollo-tracing') !== undefined;
            }
            else {
                return t.mode === 'enabled';
            }
        };
        app.post(endpoint, bodyParser.json(), apollo_upload_server_1.apolloUploadExpress(uploads), apollo_server_express_1.graphqlExpress(function (request) { return ({
            schema: _this.schema,
            tracing: tracing(request),
            context: typeof _this.context === 'function'
                ? _this.context({ request: request })
                : _this.context,
            formatError: _this.formatError,
            formatParams: _this.formatParams,
            formatResponse: _this.formatResponse,
            logFunction: _this.logFunction,
        }); }));
        if (!disablePlayground) {
            app.get(playgroundEndpoint, graphql_playground_middleware_express_1.default({
                endpoint: endpoint,
                subscriptionEndpoint: disableSubscriptions
                    ? undefined
                    : subscriptionsEndpoint,
            }));
        }
        return new Promise(function (resolve, reject) {
            if (disableSubscriptions) {
                app.listen(port, function () {
                    callback();
                    resolve();
                });
            }
            else {
                var combinedServer = http_1.createServer(app);
                combinedServer.listen(port, function () {
                    callback();
                    resolve();
                });
                _this.subscriptionServer = subscriptions_transport_ws_1.SubscriptionServer.create({
                    schema: _this.schema,
                    execute: graphql_1.execute,
                    subscribe: graphql_1.subscribe,
                    onOperation: function (message, connection, webSocket) {
                        return __assign({}, connection, { context: typeof _this.context === 'function'
                                ? _this.context({ connection: connection })
                                : _this.context });
                    },
                }, {
                    server: combinedServer,
                    path: subscriptionsEndpoint,
                });
            }
        });
    };
    return GraphQLServer;
}());
exports.GraphQLServer = GraphQLServer;
//# sourceMappingURL=index.js.map