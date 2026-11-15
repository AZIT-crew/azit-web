export const crewKeys = {
  all: ['crew'] as const,
  membersAll: () => [...crewKeys.all, 'crew-members'] as const,
  members: (crewId: number) => [...crewKeys.membersAll(), crewId] as const,
};
