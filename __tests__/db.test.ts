import { getConnection } from '../src/db';

// Mock the pools object
jest.mock('../src/db', () => {
  const originalModule = jest.requireActual('../src/db');
  return {
    __esModule: true,
    ...originalModule,
    pools: {},
  };
});

jest.setTimeout(10000); // Set a longer timeout for the entire test file

describe('getConnection', () => {
  it('should throw an error if the pool is not found for the given schema', async () => {
    const schema = 'non_existent_schema';

    await expect(getConnection(schema)).rejects.toThrow(
      `No pool found for schema: ${schema}`
    );
  });
});
