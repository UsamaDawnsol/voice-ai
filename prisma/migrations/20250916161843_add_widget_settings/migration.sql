-- CreateTable
CREATE TABLE "WidgetSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "backgroundColor" TEXT NOT NULL DEFAULT '#007bff',
    "iconColor" TEXT NOT NULL DEFAULT '#ffffff',
    "position" TEXT NOT NULL DEFAULT 'right',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "WidgetSettings_shop_key" ON "WidgetSettings"("shop");
