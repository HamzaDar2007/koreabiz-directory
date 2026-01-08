#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting KoreaBiz Directory E2E Tests...\n');

// Check if .env.test exists
const envTestPath = path.join(__dirname, '..', '.env.test');
if (!fs.existsSync(envTestPath)) {
  console.error('❌ .env.test file not found. Please create it with test configuration.');
  process.exit(1);
}

// Set test environment
process.env.NODE_ENV = 'test';

try {
  console.log('📋 Running E2E Tests...');
  
  // Run E2E tests
  execSync('npm run test:e2e', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' }
  });
  
  console.log('\n✅ All E2E tests completed successfully!');
  
} catch (error) {
  console.error('\n❌ E2E tests failed:', error.message);
  process.exit(1);
}

console.log('\n📊 Test Summary:');
console.log('- Authentication tests: Login, Register, Logout');
console.log('- Enterprise tests: CRUD operations, Access control');
console.log('- User tests: Profile management');
console.log('- Search tests: Enterprise search, Filters');
console.log('- Categories tests: List, Pagination');
console.log('- Cities tests: List, Pagination');
console.log('- Health tests: Health checks, Readiness probes');
console.log('\n🎉 E2E Testing Complete!');