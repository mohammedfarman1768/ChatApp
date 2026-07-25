import { SearchCategory } from '@repo/shared-validation';

export interface SearchFilters {
  query: string;
  category: SearchCategory;
  cursor?: string;
  limit: number;
}
