CREATE TABLE "ContentCategory" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContentCategory_scope_slug_key" ON "ContentCategory"("scope", "slug");
CREATE INDEX "ContentCategory_scope_sortOrder_idx" ON "ContentCategory"("scope", "sortOrder");
