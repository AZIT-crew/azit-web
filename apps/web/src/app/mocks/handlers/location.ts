import { mockApi } from '../api';
import { mockLocationSearch } from '../data/location';

export const locationHandlers = [
  mockApi.get('/api/v1/locations/search', ({ request }) => {
    const query = new URL(request.url).searchParams.get('query')?.trim() ?? '';
    return {
      ...mockLocationSearch,
      result: mockLocationSearch.result.filter((place) =>
        `${place.placeName} ${place.address}`.includes(query)
      ),
    };
  }),
];
