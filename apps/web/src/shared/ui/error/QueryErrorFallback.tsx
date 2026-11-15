import { Button } from '@azit/design-system/button';

import * as styles from './QueryErrorFallback.css';

interface Props {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}

export function QueryErrorFallback({ message, onRetry, isRetrying }: Props) {
  return (
    <div role="alert" className={styles.container}>
      <p className={styles.message}>{message}</p>
      <Button
        size="medium"
        state="outline"
        onClick={onRetry}
        isLoading={isRetrying}
      >
        다시 시도
      </Button>
    </div>
  );
}
