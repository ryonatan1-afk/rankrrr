-- Add part column (default 1 keeps all existing sessions as part 1)
ALTER TABLE "user_sessions" ADD COLUMN "part" INTEGER NOT NULL DEFAULT 1;

-- Add usedItemIds column to track which items were used in each part
ALTER TABLE "user_sessions" ADD COLUMN "usedItemIds" JSONB NOT NULL DEFAULT '[]';

-- Drop old unique index on (userId, categoryId)
DROP INDEX "user_sessions_userId_categoryId_key";

-- New unique index on (userId, categoryId, part) — allows part 1 and part 2
CREATE UNIQUE INDEX "user_sessions_userId_categoryId_part_key" ON "user_sessions"("userId", "categoryId", "part");
