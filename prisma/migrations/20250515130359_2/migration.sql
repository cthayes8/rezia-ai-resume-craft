/*
  Warnings:

  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "OptimizationRun" ADD COLUMN     "optimizedAtsNotes" TEXT,
ADD COLUMN     "optimizedAtsScore" DOUBLE PRECISION,
ADD COLUMN     "originalAtsNotes" TEXT,
ADD COLUMN     "originalAtsScore" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "stripeCustomerId" DROP NOT NULL,
ALTER COLUMN "stripeSubscriptionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'free';

-- CreateTable
CREATE TABLE "Scorecard" (
    "id" TEXT NOT NULL,
    "optimizationRunId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scorecard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Scorecard_optimizationRunId_key" ON "Scorecard"("optimizationRunId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- AddForeignKey
ALTER TABLE "Scorecard" ADD CONSTRAINT "Scorecard_optimizationRunId_fkey" FOREIGN KEY ("optimizationRunId") REFERENCES "OptimizationRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
