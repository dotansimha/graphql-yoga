"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
exports.express = express;
var bodyParser = require("body-parser-graphql");
var cors = require("cors");
var fs = require("fs");
var graphql_import_1 = require("graphql-import");
var path = require("path");
var graphql_playground_middleware_express_1 = require("graphql-playground-middleware-express");
var subscriptions_transport_ws_1 = require("subscriptions-transport-ws");
var http_1 = require("http");
var graphql_1 = require("graphql");
var apollo_upload_server_1 = require("apollo-upload-server");
var apollo_server_express_1 = require("apollo-server-express");
var graphql_tools_1 = require("graphql-tools");
var graphql_subscriptions_1 = require("graphql-subscriptions");
exports.PubSub = graphql_subscriptions_1.PubSub;
exports.withFilter = graphql_subscriptions_1.withFilter;
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
        if (!this.options.disableSubscriptions) {
            this.options.subscriptionsEndpoint = undefined;
        }
        this.express = express();
        // CORS support
        if (this.options.cors) {
            this.express.use(cors(this.options.cors));
        }
        else if (this.options.cors !== false) {
            this.express.use(cors());
        }
        this.express.post(this.options.endpoint, bodyParser.graphql(), apollo_upload_server_1.apolloUploadExpress(this.options.uploads));
        this.subscriptionServer = null;
        this.context = props.context;
        this.formatError = props.formatError;
        this.formatParams = props.formatParams;
        this.formatResponse = props.formatResponse;
        this.logFunction = props.logFunction;
        if (props.schema) {
            this.executableSchema = props.schema;
        }
        else if (props.typeDefs && props.resolvers) {
            var typeDefs = props.typeDefs, resolvers = props.resolvers;
            // read from .graphql file if path provided
            if (typeDefs.endsWith('graphql')) {
                var schemaPath = path.isAbsolute(typeDefs)
                    ? path.resolve(typeDefs)
                    : path.resolve(typeDefs);
                if (!fs.existsSync(schemaPath)) {
                    throw new Error("No schema found for path: " + schemaPath);
                }
                typeDefs = graphql_import_1.importSchema(schemaPath);
            }
            var uploadMixin = typeDefs.includes('scalar Upload')
                ? { Upload: apollo_upload_server_1.GraphQLUpload }
                : {};
            this.executableSchema = graphql_tools_1.makeExecutableSchema({
                typeDefs: typeDefs,
                resolvers: __assign({}, uploadMixin, resolvers),
            });
        }
    }
    GraphQLServer.prototype.start = function (callback) {
        var _this = this;
        if (callback === void 0) { callback = function () { return null; }; }
        var app = this.express;
        var _a = this.options, port = _a.port, endpoint = _a.endpoint, disablePlayground = _a.disablePlayground, disableSubscriptions = _a.disableSubscriptions, playgroundEndpoint = _a.playgroundEndpoint, subscriptionsEndpoint = _a.subscriptionsEndpoint;
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
        app.post(endpoint, apollo_server_express_1.graphqlExpress(function (request) { return __awaiter(_this, void 0, void 0, function () {
            var context, _a, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        if (!(typeof this.context === 'function')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.context({ request: request })];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = this.context;
                        _b.label = 3;
                    case 3:
                        context = _a;
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _b.sent();
                        console.error(e_1);
                        throw e_1;
                    case 5: return [2 /*return*/, {
                            schema: this.executableSchema,
                            tracing: tracing(request),
                            context: context,
                        }];
                }
            });
        }); }));
        if (!disablePlayground) {
            var isDev = process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development';
            var playgroundOptions = isDev
                ? { useGraphQLConfig: true, env: process.env }
                : { endpoint: endpoint, subscriptionsEndpoint: subscriptionsEndpoint };
            app.get(playgroundEndpoint, graphql_playground_middleware_express_1.default(playgroundOptions));
        }
        if (!this.executableSchema) {
            throw new Error('No schema defined');
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
                    schema: _this.executableSchema,
                    execute: graphql_1.execute,
                    subscribe: graphql_1.subscribe,
                    onOperation: function (message, connection, webSocket) { return __awaiter(_this, void 0, void 0, function () {
                        var context, _a, e_2;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 4, , 5]);
                                    if (!(typeof this.context === 'function')) return [3 /*break*/, 2];
                                    return [4 /*yield*/, this.context({ connection: connection })];
                                case 1:
                                    _a = _b.sent();
                                    return [3 /*break*/, 3];
                                case 2:
                                    _a = this.context;
                                    _b.label = 3;
                                case 3:
                                    context = _a;
                                    return [3 /*break*/, 5];
                                case 4:
                                    e_2 = _b.sent();
                                    console.error(e_2);
                                    throw e_2;
                                case 5: return [2 /*return*/, __assign({}, connection, { context: context })];
                            }
                        });
                    }); },
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