// Test script for Admin Reports API
// Run with: node test_admin_reports.js

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';
const ADMIN_TOKEN = 'your_admin_jwt_token_here'; // Replace with actual admin token

const testReports = async () => {
    console.log('🧪 Testing Admin Reports API...\n');

    const reports = [
        'donation-overview',
        'user-activity',
        'charity-performance',
        'volunteer-efficiency',
        'system-health'
    ];

    for (const reportType of reports) {
        try {
            console.log(`📊 Testing ${reportType} report...`);

            const response = await fetch(`${BASE_URL}/admin/reports/${reportType}`, {
                headers: {
                    'Authorization': `Bearer ${ADMIN_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                console.log(`✅ ${reportType}: SUCCESS`);
                console.log(`   - Status: ${response.status}`);
                console.log(`   - Data keys: ${Object.keys(data.data || {}).join(', ')}`);
            } else {
                console.log(`❌ ${reportType}: FAILED`);
                console.log(`   - Status: ${response.status}`);
                console.log(`   - Error: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.log(`💥 ${reportType}: ERROR`);
            console.log(`   - ${error.message}`);
        }

        console.log(''); // Empty line for readability
    }

    // Test with different parameters
    console.log('🔍 Testing with parameters...');

    try {
        const response = await fetch(`${BASE_URL}/admin/reports/donation-overview?period=7d`, {
            headers: {
                'Authorization': `Bearer ${ADMIN_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ Donation overview with period=7d: SUCCESS');
            console.log(`   - Total donations: ${data.data.summary?.totalDonations || 0}`);
            console.log(`   - Confirmation rate: ${data.data.summary?.confirmationRate || 0}%`);
        } else {
            console.log('❌ Donation overview with parameters: FAILED');
        }
    } catch (error) {
        console.log(`💥 Parameter test: ERROR - ${error.message}`);
    }

    console.log('\n🏁 Admin Reports API testing completed!');
};

// Helper function to create a simple admin user for testing
const setupTestData = async () => {
    console.log('🔧 Setting up test data...');

    // This would typically create test users, donations, etc.
    // For now, just a placeholder
    console.log('ℹ️  Make sure you have:');
    console.log('   - At least one admin user');
    console.log('   - Some test donations');
    console.log('   - Some test charities and volunteers');
    console.log('   - Valid admin JWT token\n');
};

// Run the tests
const runTests = async () => {
    await setupTestData();
    await testReports();
};

// Check if admin token is provided
if (ADMIN_TOKEN === 'your_admin_jwt_token_here') {
    console.log('⚠️  Please update ADMIN_TOKEN in the script with a valid admin JWT token');
    console.log('   You can get this by logging in as an admin user and copying the token\n');
}

runTests().catch(console.error);
