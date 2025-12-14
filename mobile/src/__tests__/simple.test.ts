/**
 * Simple Test to Validate Jest Setup
 */

describe('Jest Setup Validation', () => {
    it('should pass basic test', () => {
        expect(1 + 1).toBe(2);
    });

    it('should handle async tests', async () => {
        const result = await Promise.resolve('hello');
        expect(result).toBe('hello');
    });
});
