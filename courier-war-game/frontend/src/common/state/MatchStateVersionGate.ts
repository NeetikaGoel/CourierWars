/** Returns true only when a match snapshot advances the authoritative version. */
export function matchStateVersionAdvances(
  incomingVersion: unknown,
  currentVersion: number
): incomingVersion is number {
  return (
    typeof incomingVersion === "number" &&
    Number.isSafeInteger(incomingVersion) &&
    incomingVersion > currentVersion
  );
}
