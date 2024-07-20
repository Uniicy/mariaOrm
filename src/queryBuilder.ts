class QueryBuilder<T> {
  private tableName: string;
  private whereClauses: string[] = [];
  private orWhereClauses: string[] = [];
  private values: any[] = [];

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  where(column: keyof T, operator: string, value: any): this {
    this.whereClauses.push(`${String(column)} ${operator} ?`);
    this.values.push(value);
    return this;
  }

  orWhere(column: keyof T, operator: string, value: any): this {
    this.orWhereClauses.push(`${String(column)} ${operator} ?`);
    this.values.push(value);
    return this;
  }

  build(): string {
    let query = `SELECT * FROM ${this.tableName}`;
    if (this.whereClauses.length > 0 || this.orWhereClauses.length > 0) {
      query += ' WHERE ';
      if (this.whereClauses.length > 0) {
        query += this.whereClauses.join(' AND ');
      }
      if (this.orWhereClauses.length > 0) {
        if (this.whereClauses.length > 0) {
          query += ' OR ';
        }
        query += this.orWhereClauses.join(' OR ');
      }
    }
    return query;
  }

  getValues(): any[] {
    return this.values;
  }
}

export default QueryBuilder;
