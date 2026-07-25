import { Router } from 'express';
import { SearchController } from './controller.js';
import { SearchService } from './service.js';
import { SearchRepository } from './repository.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// Dependency Injection
const searchRepository = new SearchRepository();
const searchService = new SearchService(searchRepository);
const searchController = new SearchController(searchService);

// Apply auth middleware to all search routes
router.use(requireAuth);

router.get('/', searchController.search);
router.get('/messages', searchController.searchMessages);
router.get('/groups', searchController.searchGroups);
router.get('/users', searchController.searchUsers);
router.get('/media', searchController.searchMedia);
router.get('/history', searchController.getHistory);
router.delete('/history', searchController.clearHistory);
router.get('/suggestions', searchController.getSuggestions);
router.post('/reindex', searchController.requestReindex);

export { router as searchRouter };
