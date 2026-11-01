/** Prevents repeated terminal polls from mounting the result page more than once. */
export class MatchResultNavigationGuard {
  private navigationStarted = false;

  startOnce(navigateToResult: () => void): boolean {
    if (this.navigationStarted) {
      return false;
    }

    this.navigationStarted = true;
    navigateToResult();
    return true;
  }
}
