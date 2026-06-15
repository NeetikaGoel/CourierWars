// this file stores numeric match status values used by frontend polling
// these values must match backend/constants/MatchStatusValue.php

export const FrontendMatchStatusValue = {
  Waiting: 0,
  Ready: 1,
  Active: 2,
  Completed: 3,
  Draw: 4,
} as const;

export type FrontendMatchStatusValue =
  (typeof FrontendMatchStatusValue)[keyof typeof FrontendMatchStatusValue];

export function frontendMatchStatusLabelGet(status: number | undefined): string {
  // this keeps unknown or missing status safe for hud display
  if (status === undefined) {
    return "Unknown";
  }

  // this means one player is waiting for another player
  if (status === FrontendMatchStatusValue.Waiting) {
    return "Waiting";
  }

  // this means roles are assigned and map can be loaded
  if (status === FrontendMatchStatusValue.Ready) {
    return "Ready";
  }

  // this means gameplay is running
  if (status === FrontendMatchStatusValue.Active) {
    return "Active";
  }

  // this means match finished with a normal result
  if (status === FrontendMatchStatusValue.Completed) {
    return "Completed";
  }

  // this means match ended as draw or system cancel
  if (status === FrontendMatchStatusValue.Draw) {
    return "Draw";
  }

  // this handles any backend value frontend does not know yet
  return "Unknown";
}