// OpenCode builds one location per directory it is asked about, and every
// location starts its own set of MCP server processes. OpenChamber hands it a
// new directory for every standalone chat - the chat's own data directory -
// and every worktree adds another, so the number of locations, and the number
// of MCP server processes under them, only ever grows while the server runs.
//
// OpenCode exposes no endpoint for releasing a single location, so the only
// way to give those processes back is to restart the managed server: they are
// its children and go away with it.
//
// This counts the distinct directories routed to OpenCode so the lifecycle can
// decide when a restart would reclaim more than it costs. It is deliberately
// just a counter, not a policy: deciding when to restart stays with the
// lifecycle, which is the only place that knows whether a restart is safe.

export const createInstanceDirectoryTracker = ({ limit = 512 } = {}) => {
  // Insertion-ordered, so the oldest directory is the first one reported as
  // evicted once the tracker is full.
  const seen = new Set();

  const record = (directory) => {
    if (typeof directory !== 'string' || !directory) return;
    if (seen.has(directory)) return;
    seen.add(directory);
    // Bound the bookkeeping itself. This is a high-frequency path - every
    // directory-scoped request lands here - so the set has to stay small even
    // though the limit is far above anything a real session reaches.
    while (seen.size > limit) {
      const oldest = seen.values().next();
      if (oldest.done) break;
      seen.delete(oldest.value);
    }
  };

  const size = () => seen.size;
  const values = () => [...seen];
  // Called after a restart: every location died with the old process, so the
  // count has to start over rather than trigger again immediately.
  const reset = () => seen.clear();

  return { record, size, values, reset };
};

// The tracker production wiring shares. Exported as well as the factory so
// tests can build their own instead of asserting against shared state.
export const instanceDirectoryTracker = createInstanceDirectoryTracker();