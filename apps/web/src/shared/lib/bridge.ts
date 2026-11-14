import type { AppBridge } from '@azit/bridge';
import { createBridge } from '@azit/bridge';

export const bridge = createBridge<AppBridge>({ timeout: 20000 });
