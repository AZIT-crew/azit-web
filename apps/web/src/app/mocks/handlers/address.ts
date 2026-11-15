import { mockApi } from '../api';
import { mockSuccess } from '../data/crew';
import {
  createMockAddress,
  deleteMockAddress,
  getMockAddresses,
  updateMockAddress,
} from '../state/addresses';

export const addressHandlers = [
  mockApi.get('/api/v1/addresses', () => {
    return { ...mockSuccess, result: getMockAddresses() };
  }),

  mockApi.post('/api/v1/addresses', async ({ request }) => {
    createMockAddress(await request.json());
    return mockSuccess;
  }),

  mockApi.put('/api/v1/addresses/{addressId}', async ({ params, request }) => {
    updateMockAddress(Number(params.addressId), await request.json());
    return mockSuccess;
  }),

  mockApi.delete('/api/v1/addresses/{addressId}', ({ params }) => {
    deleteMockAddress(Number(params.addressId));
    return mockSuccess;
  }),
];
