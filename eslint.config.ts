// DPU framework
import datapos from '@datapos/eslint-config-datapos';

// ESLint configuration
export default [
    ...datapos,
    {
        rules: {
            '@typescript-eslint/no-confusing-void-expression': 'off'
        }
    }
];
