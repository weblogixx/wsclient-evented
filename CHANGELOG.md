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
