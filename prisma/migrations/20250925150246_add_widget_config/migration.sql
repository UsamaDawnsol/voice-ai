-- CreateTable
CREATE TABLE "WidgetConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Support Chat',
    "color" TEXT NOT NULL DEFAULT '#e63946',
    "greeting" TEXT NOT NULL DEFAULT '👋 Welcome! How can we help you?',
    "position" TEXT NOT NULL DEFAULT 'right',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "WidgetConfig_shop_key" ON "WidgetConfig"("shop");
