import { describe, expect, it } from 'vitest';
import { createInstanceDirectoryTracker } from './instance-directory-tracker.js';

describe('createInstanceDirectoryTracker', () => {
  it('counts each directory once no matter how many requests carry it', () => {
    const tracker = createInstanceDirectoryTracker();

    tracker.record('/repo');
    tracker.record('/repo');
    tracker.record('/other');

    expect(tracker.size()).toBe(2);
    expect(tracker.values()).toEqual(['/repo', '/other']);
  });

  it('ignores values that are not a usable directory', () => {
    const tracker = createInstanceDirectoryTracker();

    tracker.record(undefined);
    tracker.record(null);
    tracker.record('');
    tracker.record(42);

    expect(tracker.size()).toBe(0);
  });

  it('starts over after a restart, so a reclaim cannot fire twice', () => {
    const tracker = createInstanceDirectoryTracker();

    tracker.record('/repo');
    tracker.reset();

    expect(tracker.size()).toBe(0);
    expect(tracker.values()).toEqual([]);
  });

  it('bounds its own bookkeeping, dropping the oldest directory first', () => {
    const tracker = createInstanceDirectoryTracker({ limit: 2 });

    tracker.record('/one');
    tracker.record('/two');
    tracker.record('/three');

    expect(tracker.values()).toEqual(['/two', '/three']);
  });
});