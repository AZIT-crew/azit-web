import type { AppBridge } from '@azit-crew/bridge';
import { createBridge } from '@azit-crew/bridge';

export const bridge = createBridge<AppBridge>({ timeout: 20000 });
