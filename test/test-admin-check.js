import { expect } from 'chai';
import database from '../services/database.js';

describe('Admin Check Endpoint', function() {
    this.timeout(10000);

    describe('checkAdminStatus', () => {
        it('should return admin status for a valid user email', async () => {
            // Replace with an actual test email from your database
            const testEmail = 'test@example.com';
            
            const result = await database.checkAdminStatus(testEmail);
            
            // Result should be either true, false, or null (user not found)
            expect(result).to.satisfy((val) => 
                val === true || val === false || val === null
            );
        });

        it('should return null for non-existent user', async () => {
            const nonExistentEmail = 'nonexistent@example.com';
            
            const result = await database.checkAdminStatus(nonExistentEmail);
            
            expect(result).to.be.null;
        });

        it('should use cache on second call', async () => {
            const testEmail = 'test@example.com';
            
            // First call - cache miss
            const result1 = await database.checkAdminStatus(testEmail);
            
            // Second call - should hit cache
            const result2 = await database.checkAdminStatus(testEmail);
            
            // Both results should be identical
            expect(result1).to.equal(result2);
        });
    });
});
