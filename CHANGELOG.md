# 2.3.0
1. Removed all runtime dependencies: `fbemitter` is replaced by a small built-in emitter with the same API.
2. Fixed connections without a subprotocol: the client requested a subprotocol named `"null"`, which made browsers fail against servers that don't select one.
3. Fixed a crash on `null` messages from the server.
4. Server messages can no longer trigger lifecycle callbacks by using their name as `type` (`onWsMessage` caused an infinite recursion).
5. Fixed `close()` during a reconnect wait: the client reconnected anyway, and skipped the next automatic reconnect.
6. Added TypeScript types.
7. Replaced the development toolchain: `node:test`, esbuild, Babel (for the ES5 bundle only) and oxlint.
8. `dist` is no longer checked in and gets built when packing.
9. Rewrote the README.

# 2.2.0
1. Upgraded `fbemitter` to latest version 3.0.0.

# 2.1.0
1. Upgraded dev packages to latest stable versions
2. Added new callback `onMaxReconnects` that fires after timeouts

# 2.0.0
1. Upgraded development toolchain to latest package versions (eslint, webpack, babel, karma).
2. Changed code to validate against airbnb coding guidelines.
3. Provided overrideable default `onWsMessage` handler with default fallback for version `1.x.x`.
4. Exchanged `window` keyword for `self` where appropriate to make it work in WebWorkers without breaking.
5. Export only needed files for install on `package.json`

# 1.2.0
1. Added support for forced closing of connections on browser reload (defaults to false)
2. Updated all build packages to latest versions.

# 1.1.0
1. Added support for dynamic payload keys (can be configured via settings.payloadItemName)

# 1.0.0
Initial release
