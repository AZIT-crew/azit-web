import { Button } from '@azit/design-system/button';
import { Header } from '@azit/design-system/header';
import { Input } from '@azit/design-system/input';
import { AppScreen } from '@stackflow/plugin-basic-ui';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { useFlow } from '@/app/routes/stackflow';

import { resolveScheduleLocation } from '@/features/Schedule/model/resolveScheduleLocation';
import { useMeetingSpotInput } from '@/features/Schedule/model/useMeetingSpotInput';
import { MeetingSpotPicker } from '@/features/Schedule/ui';
import { LocationSearchResultItem } from '@/features/Schedule/ui/LocationSearchResultItem';

import { locationQueries } from '@/entities/Location/api/queries';
import type { LocationSearchResponse } from '@/entities/Location/model/location.model';
import {
  MEETING_SPOT_MAX_LENGTH,
  meetingSpotSchema,
} from '@/entities/Schedule/model/meetingSpot';

import { normalizeStr } from '@/shared/lib/formatters';
import { useDebounce } from '@/shared/lib/useDebounce';
import { useScheduleLocationSelectionStore } from '@/shared/store/scheduleLocationSelection';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { BackButton } from '@/shared/ui/button';
import { QueryErrorFallback } from '@/shared/ui/error';
import { AppLayout } from '@/shared/ui/layout';
import type { LatLng } from '@/shared/ui/naver-map/NaverMap';
import { Show } from '@/shared/ui/show';
import { toastError } from '@/shared/ui/toast';

import * as styles from './index.css';

type ViewState = 'search' | 'map';

const TOAST_MESSAGE = '주소 변환에 실패해 검색한 주소로 등록됩니다.';

export function ScheduleLocationPage() {
  const { pop } = useFlow();
  const setSelectedScheduleLocation = useScheduleLocationSelectionStore(
    (state) => state.setSelectedLocation
  );
  const [view, setView] = useState<ViewState>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] =
    useState<LocationSearchResponse | null>(null);
  const [adjustedCoords, setAdjustedCoords] = useState<LatLng | null>(null);
  const [isLocationNameSheetOpen, setIsLocationNameSheetOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const isRegisteringRef = useRef(false);
  const { value: locationName, ...locationNameInputProps } =
    useMeetingSpotInput();

  const debouncedQuery = useDebounce(searchQuery, 500);

  const searchOptions = locationQueries.searchQuery(debouncedQuery);
  const search = useQuery({
    ...searchOptions,
    enabled: searchOptions.enabled && view === 'search',
    throwOnError: false,
  });
  const normalizedQuery = normalizeStr(searchQuery);
  const isDebouncing = normalizedQuery !== normalizeStr(debouncedQuery);

  const handleSelectLocation = (location: LocationSearchResponse) => {
    setSelectedLocation(location);
    setAdjustedCoords(null);
    setSearchQuery(location.placeName ?? '');
    setView('map');
  };

  const handleOpenLocationNameSheet = () => {
    setIsLocationNameSheetOpen(true);
  };

  const handleRegisterLocation = async () => {
    if (isRegisteringRef.current) return;
    const parsedLocationName = meetingSpotSchema.safeParse(locationName);
    if (!selectedLocation || !parsedLocationName.success) return;
    isRegisteringRef.current = true;
    setIsRegistering(true);
    try {
      const { location, usedAddressFallback } = await resolveScheduleLocation(
        selectedLocation,
        parsedLocationName.data,
        adjustedCoords
      );
      if (usedAddressFallback) toastError(TOAST_MESSAGE);
      setSelectedScheduleLocation(location);
      pop();
    } finally {
      isRegisteringRef.current = false;
      setIsRegistering(false);
    }
  };

  return (
    <AppScreen>
      <AppLayout>
        <div className={styles.headerWrapper}>
          <Header
            left={
              <BackButton
                onClick={view === 'map' ? () => setView('search') : undefined}
              />
            }
            center="집합 장소"
          />
        </div>
        <div className={styles.mainContainer}>
          <div
            className={styles.searchWrapper}
            onClick={view === 'map' ? () => setView('search') : undefined}
          >
            <Input
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="장소, 주소 검색"
              readOnly={view === 'map'}
            />
          </div>
          <Show when={view === 'search'}>
            {!normalizedQuery ? null : isDebouncing || search.isPending ? (
              <p role="status" className={styles.searchStatus}>
                장소를 검색하는 중이에요
              </p>
            ) : search.isError ? (
              <QueryErrorFallback
                message="장소를 검색하지 못했어요"
                onRetry={() => {
                  void search.refetch();
                }}
                isRetrying={search.isFetching}
              />
            ) : (search.data ?? []).length === 0 ? (
              <div className={styles.emptyState}>
                <img
                  src="/icons/magnifying-glass.svg"
                  alt="검색 결과 없음"
                  className={styles.emptyStateIcon}
                />
                <div className={styles.emptyStateTextGroup}>
                  <p className={styles.emptyStateTitle}>검색 결과가 없어요</p>
                  <p className={styles.emptyStateDescription}>
                    철자를 확인해주세요
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.searchResultList}>
                {(search.data ?? []).map((result, index) => (
                  <LocationSearchResultItem
                    key={`${result.placeName}-${index}`}
                    name={result.placeName ?? ''}
                    keyword={searchQuery}
                    address={result.address ?? ''}
                    onClick={() => handleSelectLocation(result)}
                  />
                ))}
              </div>
            )}
          </Show>
          <Show when={view === 'map'}>
            <MeetingSpotPicker
              coords={{
                lat: selectedLocation?.latitude ?? 37.52964580905185,
                lng: selectedLocation?.longitude ?? 126.93366366931356,
              }}
              onOpenLocationNameSheet={handleOpenLocationNameSheet}
              onCoordsChange={setAdjustedCoords}
            />
          </Show>
        </div>
      </AppLayout>
      <BottomSheet
        isOpen={isLocationNameSheetOpen}
        onOutsideClick={() => {
          if (!isRegistering) setIsLocationNameSheetOpen(false);
        }}
        contentClassName={styles.locationNameSheetContent}
      >
        <p className={styles.locationNameSheetTitle}>
          선택한 곳의 장소명을 입력해주세요
        </p>
        <div className={styles.locationNameInputWrapper}>
          <Input
            value={locationName}
            {...locationNameInputProps}
            readOnly={isRegistering}
            aria-label="집합 장소명"
            placeholder="예) 여의나루역 러너스스테이션"
          >
            <Input.Description
              right={`${locationName.length}/${MEETING_SPOT_MAX_LENGTH}자`}
            />
          </Input>
        </div>
        <div className={styles.locationNameSheetFooter}>
          <Button
            size="large"
            state={locationName ? 'active' : 'disabled'}
            disabled={!locationName}
            isLoading={isRegistering}
            onClick={handleRegisterLocation}
          >
            집합 장소 등록하기
          </Button>
        </div>
      </BottomSheet>
    </AppScreen>
  );
}
