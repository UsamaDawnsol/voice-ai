-- AlterTable
ALTER TABLE "WidgetConfig" ADD COLUMN "chatBgColor" TEXT DEFAULT '#FFFFFF';
ALTER TABLE "WidgetConfig" ADD COLUMN "colorScheme" TEXT DEFAULT '0';
ALTER TABLE "WidgetConfig" ADD COLUMN "endColor" TEXT DEFAULT '#000000';
ALTER TABLE "WidgetConfig" ADD COLUMN "fontColor" TEXT DEFAULT '#000000CF';
ALTER TABLE "WidgetConfig" ADD COLUMN "fontFamily" TEXT DEFAULT 'inter, sans-serif';
ALTER TABLE "WidgetConfig" ADD COLUMN "isPulsing" BOOLEAN DEFAULT false;
ALTER TABLE "WidgetConfig" ADD COLUMN "openByDefault" TEXT DEFAULT '1';
ALTER TABLE "WidgetConfig" ADD COLUMN "startColor" TEXT DEFAULT '#000000CF';
