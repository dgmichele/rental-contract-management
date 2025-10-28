module.exports = {
  // Preset per TypeScript
  preset: 'ts-jest',
  
  // Ambiente Node.js (non browser)
  testEnvironment: 'node',
  
  // Setup globale eseguito UNA VOLTA all'inizio di tutti i test
  globalSetup: '<rootDir>/jest.global-setup.ts',
  
  // Directory radice per i test
  roots: ['<rootDir>/__tests__'],
  
  // Pattern per trovare i file di test
  testMatch: ['**/__tests__/**/*.test.ts'],
  
  // File eseguiti dopo l'environment setup ma prima dei test
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  
  // Collezione coverage
  collectCoverageFrom: [
    'controllers/**/*.ts',
    'services/**/*.ts',
    'middleware/**/*.ts',
    'utils/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  
  // Soglie coverage minime (70%)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Output verboso per debug
  verbose: true,
  
  // Forza uscita dopo tutti i test (evita hang)
  forceExit: true,
  
  // Timeout default per ogni test (aumentato per operazioni DB)
  testTimeout: 15000,
  
  // Pulizia mock tra test
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Ignora trasformazione di node_modules (velocizza)
  transformIgnorePatterns: [
    'node_modules/(?!(@react-email)/)', // Permetti trasformazione solo per @react-email
  ],
  
  // Configurazione ts-jest
  globals: {
    'ts-jest': {
      isolatedModules: true, // Velocizza compilation
    },
  },
  
  // IMPORTANTE: 1 worker per evitare conflitti DB nei test
  maxWorkers: 1,
  
  // Rileva operazioni asincrone non completate (open handles)
  detectOpenHandles: true,
  
  // Timeout per l'intera suite
  globalTeardown: undefined,
};