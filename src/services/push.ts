import { apiRequest } from ".";

/** The key browsers subscribe with; null when the server has push turned off */
export const getPushKey = (): Promise<{ publicKey: string | null }> => apiRequest("get", "/push/key");

export const savePushSubscription = (subscription: PushSubscriptionJSON): Promise<void> =>
  apiRequest("post", "/push/subscriptions", {
    data: { endpoint: subscription.endpoint, keys: subscription.keys },
  });

export const removePushSubscription = (endpoint: string): Promise<void> =>
  apiRequest("post", "/push/unsubscribe", { data: { endpoint } });
