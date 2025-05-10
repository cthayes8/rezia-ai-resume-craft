-- CreateTable
CREATE TABLE "SavedResume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedResume_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SavedResume" ADD CONSTRAINT "SavedResume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
