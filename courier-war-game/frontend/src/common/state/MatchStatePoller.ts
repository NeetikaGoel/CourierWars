/** Runs match-state reads serially and ignores completions after the page stops. */
export class MatchStatePoller<TState> {
  private requestInFlight = false;
  private stopped = false;
  private readonly stateRequest: () => Promise<TState>;
  private readonly onState: (state: TState) => void;
  private readonly onError: (errorObject: unknown) => void;

  constructor(
    stateRequest: () => Promise<TState>,
    onState: (state: TState) => void,
    onError: (errorObject: unknown) => void
  ) {
    this.stateRequest = stateRequest;
    this.onState = onState;
    this.onError = onError;
  }

  async poll(): Promise<void> {
    if (this.stopped || this.requestInFlight) {
      return;
    }

    this.requestInFlight = true;

    try {
      const state = await this.stateRequest();

      if (!this.stopped) {
        this.onState(state);
      }
    } catch (errorObject) {
      if (!this.stopped) {
        this.onError(errorObject);
      }
    } finally {
      this.requestInFlight = false;
    }
  }

  stop(): void {
    this.stopped = true;
  }
}
