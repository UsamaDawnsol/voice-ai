#!/usr/bin/env node

/**
 * Environment Configuration Checker
 * 
 * This script verifies that all required environment variables are set
 * and provides guidance for fixing any issues.
 */

import { config } from 'dotenv';
config();

const requiredVars = [
  'SHOPIFY_API_KEY',
  'SHOPIFY_API_SECRET', 
  'SHOPIFY_APP_URL',
  'SCOPES'
];

const optionalVars = [
  'DATABASE_URL',
  'OPENAI_API_KEY',
  'PINECONE_API_KEY',
  'PINECONE_ENVIRONMENT',
  'REDIS_URL'
];

console.log('🔍 Checking environment configuration...\n');

let hasErrors = false;

// Check required variables
console.log('📋 Required Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${varName.includes('SECRET') ? '***hidden***' : value}`);
  } else {
    console.log(`  ❌ ${varName}: Not set`);
    hasErrors = true;
  }
});

// Check optional variables
console.log('\n📋 Optional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${varName.includes('SECRET') || varName.includes('KEY') ? '***hidden***' : value}`);
  } else {
    console.log(`  ⚠️  ${varName}: Not set (optional)`);
  }
});

// Validate specific values
console.log('\n🔧 Validation:');

// Check SHOPIFY_APP_URL format
const appUrl = process.env.SHOPIFY_APP_URL;
if (appUrl) {
  if (appUrl.startsWith('https://') || appUrl.startsWith('http://localhost')) {
    console.log('  ✅ SHOPIFY_APP_URL format looks correct');
  } else {
    console.log('  ❌ SHOPIFY_APP_URL should start with https:// or http://localhost');
    hasErrors = true;
  }
} else {
  hasErrors = true;
}

// Check SCOPES
const scopes = process.env.SCOPES;
if (scopes) {
  const requiredScopes = ['read_products', 'write_script_tags'];
  const missingScopes = requiredScopes.filter(scope => !scopes.includes(scope));
  
  if (missingScopes.length === 0) {
    console.log('  ✅ SCOPES includes required permissions');
  } else {
    console.log(`  ❌ SCOPES missing: ${missingScopes.join(', ')}`);
    hasErrors = true;
  }
} else {
  hasErrors = true;
}

// Summary
console.log('\n📊 Summary:');
if (hasErrors) {
  console.log('❌ Configuration issues found. Please fix the errors above.');
  console.log('\n💡 Quick fixes:');
  console.log('1. Copy env.example to .env');
  console.log('2. Update the values in .env with your actual credentials');
  console.log('3. Make sure SHOPIFY_APP_URL matches your tunnel URL');
  console.log('4. Restart your development server');
} else {
  console.log('✅ All required configuration looks good!');
  console.log('\n🚀 You can now run: npm run dev');
}

console.log('\n📚 For more help, check the Shopify App development docs:');
console.log('   https://shopify.dev/docs/apps/getting-started');
