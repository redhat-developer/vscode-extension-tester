// eslint.config.js

import { defineConfig } from 'eslint-define-config';
import ts from '@typescript-eslint/parser';
import tsEslint from '@typescript-eslint/eslint-plugin';
import stylisticEslint from '@stylistic/eslint-plugin';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig([
	{
		ignores: ['**/*.test.js'],
	},
	eslintPluginPrettierRecommended,
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parser: ts,
			parserOptions: {
				ecmaVersion: 2024,
				sourceType: 'module',
				project: './tsconfig.json',
				ecmaFeatures: {
					impliedStrict: true,
				},
			},
			globals: {
				// declare global variables here
				browser: 'readonly',
				es2024: true,
				mocha: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': tsEslint,
			'@stylistic': stylisticEslint,
		},
		rules: {
			'@typescript-eslint/no-var-requires': 'off', // allows require statements outside of imports
			'@typescript-eslint/no-floating-promises': 'warn',
			'no-unused-expressions': 'off',
			'@typescript-eslint/no-unused-expressions': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					vars: 'all',
					args: 'after-used',
					ignoreRestSiblings: true,
					caughtErrors: 'none', // ignore unused variables in catch blocks
				},
			],
			'@typescript-eslint/no-namespace': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-this-alias': 'off',
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: 'variable',
					format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
				},
			],
			'@stylistic/semi': 'warn',
			curly: 'warn',
			eqeqeq: ['warn', 'always'],
			'no-redeclare': 'warn',
			'no-throw-literal': 'warn',
			'prettier/prettier': ['warn'],
		},
	},
]);
