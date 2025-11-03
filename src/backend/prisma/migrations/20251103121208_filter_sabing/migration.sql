-- CreateEnum
CREATE TYPE "FilterSortOption" AS ENUM ('HIGHEST_AMOUNT', 'LOWEST_AMOUNT', 'NEWEST_FIRST', 'OLDEST_FIRST');

-- CreateTable
CREATE TABLE "Filter" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT,
    "minPrice" INTEGER,
    "maxPrice" INTEGER,
    "dateFrom" TIMESTAMP(3),
    "dateTo" TIMESTAMP(3),
    "searchText" TEXT,
    "transactionType" "TransactionType",
    "sortOption" "FilterSortOption" DEFAULT 'NEWEST_FIRST',
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Filter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilterCategory" (
    "filterId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "FilterCategory_pkey" PRIMARY KEY ("filterId","categoryId")
);

-- AddForeignKey
ALTER TABLE "Filter" ADD CONSTRAINT "Filter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilterCategory" ADD CONSTRAINT "FilterCategory_filterId_fkey" FOREIGN KEY ("filterId") REFERENCES "Filter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilterCategory" ADD CONSTRAINT "FilterCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
