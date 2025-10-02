-- AlterTable
ALTER TABLE "WidgetConfig" ADD COLUMN "agentName" TEXT DEFAULT 'Assistant';
ALTER TABLE "WidgetConfig" ADD COLUMN "agentRole" TEXT DEFAULT 'Customer Support';
ALTER TABLE "WidgetConfig" ADD COLUMN "avatar" TEXT DEFAULT 'https://cdn.shopify.com/s/files/1/0780/7745/0100/files/default-avatar.png';
ALTER TABLE "WidgetConfig" ADD COLUMN "language" TEXT DEFAULT 'en';
ALTER TABLE "WidgetConfig" ADD COLUMN "responseLength" TEXT DEFAULT 'medium';
ALTER TABLE "WidgetConfig" ADD COLUMN "tone" TEXT DEFAULT 'friendly';
