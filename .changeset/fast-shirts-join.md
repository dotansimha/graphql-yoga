## Multiple parameters are not recommended (not used internally) for log methods

Previously sometimes Yoga used to send data to the provided logger like below;

```js
yogaLogger.debug(arg1, arg2, arg3)
```

This behavior is working fine with JavaScript's native `console` implementation but most of the other non native logger implementation like Pino only accept a single parameter for its logging methods. So we decided to avoid sending multiple parameters to the logger.
However, in order to prevent a breaking change, we kept the signatures of logger methods and they will still accept multiple parameters in a single call. You should keep on mind that eventually we will stop accepting multiple parameters and have the behavior similar to Pino's.

## Note for custom logger and fastify users

We still recommend to update your `logging` parameter in `createServer` call to make sure the other parameters after the first one aren't ignored if exists;

```js
createServer({
  ...someOtherOptions,
  logging: {
    // app.log is Fastify's logger
    // You should replace it with your own if you have some other logger implementation
    debug: (...args) => args.forEach((arg) => app.log.debug(arg)),
    info: (...args) => args.forEach((arg) => app.log.info(arg)),
    warn: (...args) => args.forEach((arg) => app.log.warn(arg)),
    error: (...args) => args.forEach((arg) => app.log.error(arg)),
  },
})
```

## No more custom `inspect`

Previously Yoga's default logger implementation was using a platform independent port of Node's `util.inspect`. It was helping us to mimic `console.log`'s behavior to serialize object in a pretty way. But we no longer use it and pass multiple parameters to `console.log/debug/info/error` instead and leave the serialization to the environment. Don't get confused with the one above :) This is an optimization with default `console` which already supports multiple values. But the improvement above is for non native logger implementations.
