-- AlterTable
ALTER TABLE "OptimizationRun" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "freeRunsRemaining" INTEGER NOT NULL DEFAULT 1;
