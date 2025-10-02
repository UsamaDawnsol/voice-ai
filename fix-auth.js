#!/usr/bin/env node

/**
 * Authentication Fix Script for Shopify App
 * 
 * This script helps fix authentication issues by:
 * 1. Clearing expired sessions from the database
 * 2. Providing instructions for re-authentication
 * 3. Verifying the app configuration
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAuthentication() {
  console.log('🔧 Starting authentication fix process...\n');

  try {
    // 1. Check current sessions
    console.log('📊 Checking current sessions...');
    const sessions = await prisma.session.findMany();
    console.log(`Found ${sessions.length} sessions in database`);

    if (sessions.length > 0) {
      console.log('\n📋 Current sessions:');
      sessions.forEach((session, index) => {
        console.log(`  ${index + 1}. Shop: ${session.shop}`);
        console.log(`     ID: ${session.id}`);
        console.log(`     Online: ${session.isOnline}`);
        console.log(`     Expires: ${session.expires || 'Never'}`);
        console.log(`     Scope: ${session.scope || 'Not set'}`);
        console.log('');
      });
    }

    // 2. Clear expired sessions
    console.log('🧹 Cleaning up expired sessions...');
    const now = new Date();
    const expiredSessions = await prisma.session.findMany({
      where: {
        expires: {
          lt: now
        }
      }
    });

    if (expiredSessions.length > 0) {
      console.log(`Found ${expiredSessions.length} expired sessions`);
      await prisma.session.deleteMany({
        where: {
          expires: {
            lt: now
          }
        }
      });
      console.log('✅ Expired sessions cleared');
    } else {
      console.log('✅ No expired sessions found');
    }

    // 3. Check app configuration
    console.log('\n⚙️  Checking app configuration...');
    const appUrl = process.env.SHOPIFY_APP_URL;
    const apiKey = process.env.SHOPIFY_API_KEY;
    const apiSecret = process.env.SHOPIFY_API_SECRET;

    console.log(`App URL: ${appUrl || '❌ Not set'}`);
    console.log(`API Key: ${apiKey ? '✅ Set' : '❌ Not set'}`);
    console.log(`API Secret: ${apiSecret ? '✅ Set' : '❌ Not set'}`);

    if (!appUrl || !apiKey || !apiSecret) {
      console.log('\n❌ Missing required environment variables!');
      console.log('Please check your .env file and ensure all required variables are set.');
      return;
    }

    // 4. Provide next steps
    console.log('\n🚀 Next steps to fix authentication:');
    console.log('1. Make sure your app is running with the correct URL');
    console.log('2. In Shopify Admin, go to Apps > App and sales channel settings');
    console.log('3. Find your app and click "Uninstall" if it exists');
    console.log('4. Reinstall the app from your development environment');
    console.log('5. The app should now authenticate properly');

    console.log('\n📝 Important URLs:');
    console.log(`   App URL: ${appUrl}`);
    console.log(`   Auth URL: ${appUrl}/auth`);
    console.log(`   Main App: ${appUrl}/app`);

  } catch (error) {
    console.error('❌ Error during authentication fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixAuthentication().catch(console.error);


