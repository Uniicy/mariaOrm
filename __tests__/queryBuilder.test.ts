import QueryBuilder from '../src/queryBuilder';

describe('QueryBuilder', () => {
  it('should build a query with orWhere clauses', () => {
    const queryBuilder = new QueryBuilder<{ id: number; name: string }>(
      'users'
    );
    queryBuilder.where('id', '=', 1).orWhere('name', '=', 'John Doe');

    const query = queryBuilder.build();
    const values = queryBuilder.getValues();

    expect(query).toBe('SELECT * FROM users WHERE id = ? OR name = ?');
    expect(values).toEqual([1, 'John Doe']);
  });
});
