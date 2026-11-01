import assert from "node:assert/strict";
import test from "node:test";

import { MatchStatePoller } from "../src/common/state/MatchStatePoller.ts";
import { MatchResultNavigationGuard } from "../src/common/state/MatchResultNavigationGuard.ts";
import { matchStateVersionAdvances } from "../src/common/state/MatchStateVersionGate.ts";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

test("only a newer safe integer version advances the rendered game state", () => {
  assert.equal(matchStateVersionAdvances(9, 8), true);
  assert.equal(matchStateVersionAdvances(8, 8), false);
  assert.equal(matchStateVersionAdvances(7, 8), false);
  assert.equal(matchStateVersionAdvances("9", 8), false);
  assert.equal(matchStateVersionAdvances(Number.MAX_SAFE_INTEGER + 1, 8), false);
});

test("repeated terminal polls navigate to the result page once", () => {
  const navigationGuard = new MatchResultNavigationGuard();
  let navigationCount = 0;

  assert.equal(navigationGuard.startOnce(() => navigationCount++), true);
  assert.equal(navigationGuard.startOnce(() => navigationCount++), false);
  assert.equal(navigationCount, 1);
});

test("match polling never overlaps requests", async () => {
  const requestGate = deferred();
  const receivedStates = [];
  let requestCount = 0;
  const poller = new MatchStatePoller(
    () => {
      requestCount += 1;
      return requestGate.promise;
    },
    (state) => receivedStates.push(state),
    (errorObject) => assert.fail(`unexpected polling error: ${errorObject}`)
  );

  const firstPoll = poller.poll();
  await poller.poll();
  assert.equal(requestCount, 1);

  requestGate.resolve({ stateVersion: 12, timerRemainingMs: 4200 });
  await firstPoll;
  assert.deepEqual(receivedStates, [{ stateVersion: 12, timerRemainingMs: 4200 }]);
});

test("stopping the match poller ignores an in-flight response", async () => {
  const requestGate = deferred();
  const receivedStates = [];
  const poller = new MatchStatePoller(
    () => requestGate.promise,
    (state) => receivedStates.push(state),
    () => assert.fail("a stopped poller must ignore late errors")
  );

  const request = poller.poll();
  poller.stop();
  requestGate.resolve({ stateVersion: 13 });
  await request;

  assert.deepEqual(receivedStates, []);
});

test("a failed poll reports the error and permits the next poll", async () => {
  const expectedError = new Error("temporary network error");
  const errors = [];
  const receivedStates = [];
  let requestCount = 0;
  const poller = new MatchStatePoller(
    async () => {
      requestCount += 1;
      if (requestCount === 1) {
        throw expectedError;
      }

      return { stateVersion: 14 };
    },
    (state) => receivedStates.push(state),
    (errorObject) => errors.push(errorObject)
  );

  await poller.poll();
  await poller.poll();

  assert.equal(requestCount, 2);
  assert.deepEqual(errors, [expectedError]);
  assert.deepEqual(receivedStates, [{ stateVersion: 14 }]);
});
