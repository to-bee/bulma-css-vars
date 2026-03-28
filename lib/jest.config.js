module.exports = {
  transform: {
    '^.+\\.(ts|js)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.test.json'
    }]
  },
  testEnvironment: 'node'
}
