import { z } from 'zod';

export const SearchCategorySchema = z.enum(['ALL', 'USERS', 'GROUPS', 'MESSAGES', 'MEDIA']);

export const SearchPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export const SearchQuerySchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty').max(100),
  category: SearchCategorySchema.default('ALL'),
}).merge(SearchPaginationSchema);

export const SearchHistorySchema = z.object({
  id: z.string().uuid(),
  query: z.string(),
  category: SearchCategorySchema,
  createdAt: z.string().datetime(),
});

export const SearchSuggestionSchema = z.object({
  query: z.string(),
  score: z.number(),
});

export const ReindexSchema = z.object({
  entityType: z.enum(['USER', 'GROUP', 'MESSAGE', 'GROUP_MESSAGE', 'MEDIA']).optional(),
});

// Infer types
export type SearchCategory = z.infer<typeof SearchCategorySchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type SearchPagination = z.infer<typeof SearchPaginationSchema>;
export type SearchHistory = z.infer<typeof SearchHistorySchema>;
export type SearchSuggestion = z.infer<typeof SearchSuggestionSchema>;
export type ReindexRequest = z.infer<typeof ReindexSchema>;
