-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_authorId_fkey";

-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "authorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "color" TEXT;

-- AlterTable
ALTER TABLE "votes" ADD COLUMN     "round" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
