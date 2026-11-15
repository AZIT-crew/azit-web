import { mutationOptions } from '@tanstack/react-query';

import { deleteJoinRequest } from './deleteJoinRequest';
import { postCreateCrew } from './postCreateCrew';
import { postJoinCrew } from './postJoinCrew';

export const crewEntityQueries = {
  createCrew: mutationOptions({ mutationFn: postCreateCrew }),
  joinCrew: mutationOptions({ mutationFn: postJoinCrew }),
  deleteJoinRequest: mutationOptions({
    mutationFn: ({ crewId }: { crewId: number }) => deleteJoinRequest(crewId),
  }),
};
