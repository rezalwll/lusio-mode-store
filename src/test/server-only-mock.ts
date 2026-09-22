// Test-only empty stand-in for the `server-only` boundary marker.
// Production resolution keeps the real marker (react-server condition),
// so importing server code from client bundles still fails loudly there.
export {};
