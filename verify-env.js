/**
 * Environment Variables Verification Script
 * Run this to check if your .env file is configured correctly
 * 
 * Usage: node verify-env.js
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '.env');

console.log('🔍 Verifying Environment Variables...\n');

try {
  const envContent = readFileSync(envPath, 'utf-8');
  const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

  const envVars = {};
  envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

  console.log('📋 Found Environment Variables:\n');

  // Required variables
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY'
  ];

  // Optional variables
  const optional = [
    'VITE_PYTHON_BACKEND_URL',
    'VITE_OLLAMA_BASE_URL',
    'VITE_USE_DIRECT_BACKEND',
    'VITE_PUBLIC_BASE_URL',
    'VITE_HUGGINGFACE_API_KEY'
  ];

  let hasErrors = false;

  console.log('✅ REQUIRED VARIABLES:');
  required.forEach(key => {
    const value = envVars[key];
    if (value && value !== '' && !value.includes('your-') && !value.includes('placeholder')) {
      // Mask sensitive values
      const displayValue = key.includes('KEY') || key.includes('SECRET') 
        ? value.substring(0, 10) + '...' + value.substring(value.length - 4)
        : value;
      console.log(`   ✓ ${key} = ${displayValue}`);
    } else {
      console.log(`   ✗ ${key} = MISSING or INVALID`);
      hasErrors = true;
    }
  });

  console.log('\n📝 OPTIONAL VARIABLES:');
  optional.forEach(key => {
    const value = envVars[key];
    if (value && value !== '' && !value.includes('your-') && !value.includes('placeholder')) {
      console.log(`   ✓ ${key} = ${value}`);
    } else {
      console.log(`   ○ ${key} = Not set (will use default)`);
    }
  });

  console.log('\n' + '='.repeat(60));

  // Validation checks
  console.log('\n🔎 VALIDATION CHECKS:\n');

  // Check Supabase URL format
  const supabaseUrl = envVars['VITE_SUPABASE_URL'];
  if (supabaseUrl) {
    if (supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co')) {
      console.log('   ✓ Supabase URL format is correct');
    } else {
      console.log('   ⚠ Supabase URL should start with https:// and contain .supabase.co');
      hasErrors = true;
    }
  }

  // Check Supabase Key format
  const supabaseKey = envVars['VITE_SUPABASE_PUBLISHABLE_KEY'];
  if (supabaseKey) {
    if (supabaseKey.length > 50 && supabaseKey.startsWith('eyJ')) {
      console.log('   ✓ Supabase Key format looks correct (JWT token)');
    } else {
      console.log('   ⚠ Supabase Key should be a JWT token (starts with eyJ)');
      hasErrors = true;
    }
  }

  // Check backend URLs
  const backendUrl = envVars['VITE_PYTHON_BACKEND_URL'] || 'http://localhost:8000';
  if (backendUrl.startsWith('http://') || backendUrl.startsWith('https://')) {
    console.log('   ✓ Backend URL format is correct');
  } else {
    console.log('   ⚠ Backend URL should start with http:// or https://');
  }

  console.log('\n' + '='.repeat(60));

  if (hasErrors) {
    console.log('\n❌ ISSUES FOUND:');
    console.log('   Please fix the errors above before running the app.');
    console.log('   See SETUP_LOCAL.md for instructions.\n');
    process.exit(1);
  } else {
    console.log('\n✅ ALL CHECKS PASSED!');
    console.log('   Your .env file is configured correctly.');
    console.log('   You can now run: npm run dev\n');
    process.exit(0);
  }

} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('❌ .env file not found!');
    console.log('\n📝 To create one:');
    console.log('   1. Copy .env.example to .env');
    console.log('   2. Fill in your Supabase credentials');
    console.log('   3. Run this script again\n');
  } else {
    console.log('❌ Error reading .env file:', error.message);
  }
  process.exit(1);
}
