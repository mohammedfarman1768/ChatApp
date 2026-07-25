import { Request, Response, NextFunction } from 'express';
import { aiService } from './service.js';
import { 
  AISummarySchema, 
  AISmartReplySchema, 
  AIRewriteSchema, 
  AITranslateSchema,
  AIGrammarSchema,
  AIModerationSchema,
  AIGroupDescriptionSchema,
  AIGroupRulesSchema,
  AIPreferencesUpdateSchema
} from '@repo/shared-validation';

export class AIController {
  generateSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).send();
      const { targetId, targetType } = AISummarySchema.parse(req.body);
      const result = await aiService.generateSummary(req.user.userId, targetId, targetType);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  generateSmartReplies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).send();
      const { targetId, targetType } = AISmartReplySchema.parse(req.body);
      const result = await aiService.generateSmartReplies(req.user.userId, targetId, targetType);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  rewriteMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).send();
      const { text, tone } = AIRewriteSchema.parse(req.body);
      const result = await aiService.rewriteMessage(req.user.userId, text, tone);
      res.json({ text: result });
    } catch (error) {
      next(error);
    }
  };

  translateMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).send();
      const { text, targetLanguage } = AITranslateSchema.parse(req.body);
      const result = await aiService.translateMessage(req.user.userId, text, targetLanguage);
      res.json({ text: result });
    } catch (error) {
      next(error);
    }
  };

  fixGrammar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).send();
      const { text } = AIGrammarSchema.parse(req.body);
      const result = await aiService.fixGrammar(req.user.userId, text);
      res.json({ text: result });
    } catch (error) {
      next(error);
    }
  };

  runModeration = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).send();
      const { text } = AIModerationSchema.parse(req.body);
      const result = await aiService.runModeration(req.user.userId, text);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  generateGroupDescription = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).send();
      const { name, purpose } = AIGroupDescriptionSchema.parse(req.body);
      const result = await aiService.generateGroupDescription(req.user.userId, name, purpose);
      res.json({ text: result });
    } catch (error) {
      next(error);
    }
  };

  generateGroupRules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).send();
      const { name, purpose } = AIGroupRulesSchema.parse(req.body);
      const result = await aiService.generateGroupRules(req.user.userId, name, purpose);
      res.json({ rules: result });
    } catch (error) {
      next(error);
    }
  };

  getCapabilities = (req: Request, res: Response) => {
    res.json(aiService.getCapabilities());
  };

  getUsage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).send();
      const cursor = req.query.cursor as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const usage = await aiService.getUsage(req.user.userId, cursor, limit);
      res.json({ data: usage });
    } catch (error) {
      next(error);
    }
  };

  getPreferences = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).send();
      const prefs = await aiService.getPreferences(req.user.userId);
      res.json(prefs);
    } catch (error) {
      next(error);
    }
  };

  updatePreferences = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).send();
      const data = AIPreferencesUpdateSchema.parse(req.body);
      const prefs = await aiService.updatePreferences(req.user.userId, data);
      res.json(prefs);
    } catch (error) {
      next(error);
    }
  };
}

export const aiController = new AIController();
