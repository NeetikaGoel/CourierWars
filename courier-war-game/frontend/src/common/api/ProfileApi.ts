// this file connects frontend profile screens to backend profile api

import { apiJsonGet } from "./ApiClient";
import type { ProfileResponse } from "../apiType/ProfileApiType";

export const profileApi = {
  getProfile: async (): Promise<ProfileResponse> => {
    return apiJsonGet<ProfileResponse>("/profile");
  },
};