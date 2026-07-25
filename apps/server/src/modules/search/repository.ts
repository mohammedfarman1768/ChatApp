import { SearchCategory, SearchEntityType, Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client.js';

export class SearchRepository {
  async upsertSearchIndex(
    entityType: SearchEntityType,
    entityId: string,
    searchableText: string,
    ownerId?: string | null,
    permissionsMetadata?: any
  ) {
    // Upsert the basic record
    const record = await prisma.searchIndex.upsert({
      where: {
        id: await this.findIdByEntity(entityType, entityId) ?? '',
      },
      create: {
        entityType,
        entityId,
        ownerId,
        searchableText,
        permissionsMetadata: permissionsMetadata || Prisma.DbNull,
      },
      update: {
        searchableText,
        ownerId,
        permissionsMetadata: permissionsMetadata || Prisma.DbNull,
        updatedAt: new Date(),
        deletedAt: null,
      },
    });

    // Update the tsvector manually
    await prisma.$executeRaw`
      UPDATE "SearchIndex"
      SET "searchVector" = to_tsvector('english', ${searchableText})
      WHERE "id" = ${record.id}
    `;

    return record;
  }

  private async findIdByEntity(entityType: SearchEntityType, entityId: string): Promise<string | null> {
    const record = await prisma.searchIndex.findFirst({
      where: { entityType, entityId },
      select: { id: true },
    });
    return record?.id || null;
  }

  async removeSearchIndex(entityType: SearchEntityType, entityId: string) {
    await prisma.searchIndex.updateMany({
      where: { entityType, entityId },
      data: { deletedAt: new Date() },
    });
  }

  async search(query: string, category: SearchCategory, userId: string, blockedIds: string[], cursor?: string, limit: number = 20) {
    // 1. Build the tsquery with prefix matching
    const tsQueryStr = query.trim().split(/\s+/).map(term => `${term}:*`).join(' & ');

    // 2. We use raw SQL for proper FTS ranking, snippet generation, and JSONB filtering.
    // In a real app we'd construct dynamic SQL for category & cursor, but here's a combined approach.
    
    // For permission-aware filtering, we check if the current userId matches the ownerId,
    // or if the entity is public, or if they are in the participants array in metadata.
    // The exact JSON structure depends on what we emit. Let's assume permissionsMetadata is:
    // { visibility: 'PUBLIC' | 'PRIVATE', participants: string[], groupId: string }
    
    let categoryFilter = Prisma.empty;
    if (category !== 'ALL') {
      const dbCategory = category === 'USERS' ? 'USER' :
                         category === 'GROUPS' ? 'GROUP' :
                         category === 'MESSAGES' ? 'MESSAGE' :
                         category === 'MEDIA' ? 'MEDIA' : null;
      if (dbCategory) {
        categoryFilter = Prisma.sql`AND "entityType" = ${dbCategory}::"SearchEntityType"`;
      }
    }

    let blockedFilter = Prisma.empty;
    if (blockedIds.length > 0) {
      // Create a safely parameterized IN clause
      blockedFilter = Prisma.sql`AND "ownerId" NOT IN (${Prisma.join(blockedIds)})`;
    }

    const results = await prisma.$queryRaw<any[]>`
      SELECT 
        id, 
        "entityType", 
        "entityId", 
        "ownerId",
        ts_headline('english', "searchableText", to_tsquery('english', ${tsQueryStr})) as snippet,
        ts_rank("searchVector", to_tsquery('english', ${tsQueryStr})) as rank,
        "createdAt"
      FROM "SearchIndex"
      WHERE "searchVector" @@ to_tsquery('english', ${tsQueryStr})
        AND "deletedAt" IS NULL
        ${categoryFilter}
        ${blockedFilter}
        AND (
          "ownerId" = ${userId}
          OR ("permissionsMetadata"->>'visibility') = 'PUBLIC'
          OR "permissionsMetadata"->'participants' @> ${'"' + userId + '"'}::jsonb
          -- We can add more permission checks here as needed
        )
      ORDER BY rank DESC, "createdAt" DESC
      LIMIT ${limit}
    `;

    return results;
  }

  async saveSearchHistory(userId: string, query: string, category: SearchCategory) {
    await prisma.searchHistory.create({
      data: {
        userId,
        query,
        category,
      },
    });

    // Cleanup old history (keep last 50)
    const historyCounts = await prisma.searchHistory.count({ where: { userId } });
    if (historyCounts > 50) {
      const oldRecords = await prisma.searchHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: 50,
        take: historyCounts - 50,
      });
      if (oldRecords.length > 0) {
        await prisma.searchHistory.deleteMany({
          where: { id: { in: oldRecords.map(r => r.id) } },
        });
      }
    }
  }

  async getSearchHistory(userId: string) {
    return prisma.searchHistory.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async clearSearchHistory(userId: string) {
    await prisma.searchHistory.deleteMany({
      where: { userId },
    });
  }

  async getSuggestions(userId: string, query: string) {
    // Basic prefix matching on user's own history
    const history = await prisma.searchHistory.findMany({
      where: { 
        userId, 
        deletedAt: null,
        query: { startsWith: query, mode: 'insensitive' }
      },
      select: { query: true },
      distinct: ['query'],
      take: 5,
    });
    
    return history.map((h, i) => ({
      query: h.query,
      score: 1.0 - (i * 0.1), // Dummy score
    }));
  }
}
