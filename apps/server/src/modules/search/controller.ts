import { Request, Response, NextFunction } from 'express';
import { SearchService } from './service.js';
import { SearchRequestSchema, ReindexSchema } from './validation.js';

export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).send();
      const filters = SearchRequestSchema.parse(req.query);
      
      const result = await this.searchService.search(req.user.userId, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  searchMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).send();
      const filters = SearchRequestSchema.parse({ ...req.query, category: 'MESSAGES' });
      const result = await this.searchService.search(req.user.userId, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  searchGroups = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).send();
      const filters = SearchRequestSchema.parse({ ...req.query, category: 'GROUPS' });
      const result = await this.searchService.search(req.user.userId, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  searchUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).send();
      const filters = SearchRequestSchema.parse({ ...req.query, category: 'USERS' });
      const result = await this.searchService.search(req.user.userId, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  searchMedia = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).send();
      const filters = SearchRequestSchema.parse({ ...req.query, category: 'MEDIA' });
      const result = await this.searchService.search(req.user.userId, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).send();
      const history = await this.searchService.getHistory(req.user.userId);
      res.json(history);
    } catch (error) {
      next(error);
    }
  };

  clearHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).send();
      await this.searchService.clearHistory(req.user.userId);
      res.json({ message: 'Search history cleared' });
    } catch (error) {
      next(error);
    }
  };

  getSuggestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).send();
      const query = req.query.query as string || '';
      const suggestions = await this.searchService.getSuggestions(req.user.userId, query);
      res.json(suggestions);
    } catch (error) {
      next(error);
    }
  };

  requestReindex = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).send();
      const data = ReindexSchema.parse(req.body);
      const result = await this.searchService.requestReindex(req.user.userId, data.entityType);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
