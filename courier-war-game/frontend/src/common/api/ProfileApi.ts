// this file connects frontend profile screens to backend profile api

import { apiJsonGet, type ApiClientRequestOptions } from "./ApiClient";
import type { ProfileResponse } from "../apiType/ProfileApiType";

export const profileApi = {
  getProfile: async (options: ApiClientRequestOptions = {}): Promise<ProfileResponse> => {
    return apiJsonGet<ProfileResponse>("/profile", options);
  },
};