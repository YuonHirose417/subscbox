import { router } from 'expo-router';

export { reachedSubscriptionLimit, SUBSCRIPTION_LIMIT_REASON } from './limits';

/** ペイウォールを開く。reason は画面上部に出す「なぜ開いたか」の説明 */
export function openPaywall(reason?: string): void {
  router.push(reason ? { pathname: '/paywall', params: { reason } } : '/paywall');
}
