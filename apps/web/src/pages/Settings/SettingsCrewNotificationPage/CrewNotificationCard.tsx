import clsx from 'clsx';

import type { CrewNotificationSetting } from '@/entities/User/model';
import { useCrewNotificationSetting } from '@/entities/User/model/useCrewNotificationSetting';

import * as styles from './CrewNotificationCard.css';

interface ToggleSwitchProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

function ToggleSwitch({
  checked,
  label,
  onChange,
  disabled,
  isLoading,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      aria-label={`${label} ${checked ? '켜짐' : '꺼짐'}`}
      className={clsx(
        styles.switchTrack,
        checked ? styles.switchTrackOn : styles.switchTrackOff
      )}
      onClick={() => onChange(!checked)}
    >
      <span
        className={clsx(
          styles.switchThumb,
          checked ? styles.switchThumbOn : styles.switchThumbOff
        )}
        aria-hidden
      >
        {isLoading && <span className={styles.pendingSpinner} />}
      </span>
    </button>
  );
}

interface CrewNotificationCardProps {
  crew: CrewNotificationSetting;
  disabled?: boolean;
}

export function CrewNotificationCard({
  crew,
  disabled = false,
}: CrewNotificationCardProps) {
  const { update, isPending, variables } = useCrewNotificationSetting(
    crew.crewId
  );
  const updateSetting = (patch: Parameters<typeof update>[0]) => {
    if (!disabled) update(patch);
  };
  return (
    <section className={styles.card} aria-label={crew.crewName}>
      <div className={styles.row}>
        <div className={styles.crewInfo}>
          <img
            src={crew.crewImageUrl ?? '/icons/icon-crew-default.svg'}
            alt={crew.crewName}
            className={styles.crewImage}
          />
          <div className={styles.crewTextWrapper}>
            <span className={styles.crewName}>{crew.crewName}</span>
            <span className={styles.crewMeta}>전체알림</span>
          </div>
        </div>
        <ToggleSwitch
          checked={crew.allEnabled}
          label={`${crew.crewName} 전체알림`}
          onChange={(enabled) => updateSetting({ allEnabled: enabled })}
          disabled={disabled || isPending}
          isLoading={isPending && variables?.allEnabled != null}
        />
      </div>
      <div className={styles.divider} aria-hidden />
      <div className={styles.row}>
        <span className={styles.itemLabel}>정기런 알림</span>
        <ToggleSwitch
          checked={crew.regularRunEnabled}
          label={`${crew.crewName} 정기런 알림`}
          onChange={(enabled) => updateSetting({ regularRunEnabled: enabled })}
          disabled={disabled || isPending}
          isLoading={isPending && variables?.regularRunEnabled != null}
        />
      </div>
      <div className={styles.row}>
        <span className={styles.itemLabel}>번개런 알림</span>
        <ToggleSwitch
          checked={crew.lightningRunEnabled}
          label={`${crew.crewName} 번개런 알림`}
          onChange={(enabled) =>
            updateSetting({ lightningRunEnabled: enabled })
          }
          disabled={disabled || isPending}
          isLoading={isPending && variables?.lightningRunEnabled != null}
        />
      </div>
    </section>
  );
}
