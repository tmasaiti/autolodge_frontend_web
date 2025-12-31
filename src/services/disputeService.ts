// TEMPORARILY DISABLED - MOCK IMPLEMENTATION
export const disputeService = {
  createDispute: async () => ({ id: 1 }),
  getDispute: async () => ({ id: 1 }),
  searchDisputes: async () => ({ disputes: [], total: 0 }),
  uploadEvidence: async () => ({ id: 1 }),
  getEvidence: async () => ([]),
  addComment: async () => ({ id: 1 }),
  getComments: async () => ([]),
  resolveDispute: async () => ({ id: 1 }),
  escalateDispute: async () => ({ id: 1 }),
  getStatistics: async () => ({ total: 0 }),
  getRecentDisputes: async () => ([]),
  getDisputesByOperator: async () => ([])
};