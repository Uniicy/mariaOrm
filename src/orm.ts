import { getConnection, getColumnNames } from './db';
import QueryBuilder from './queryBuilder';
import { Relation } from './relations';
import { FindOptions } from './options';

class ORM<T> {
  private tableName: string;
  private schema: string;
  private relations: { [key: string]: Relation<T, any> } = {};
  private columnCache: { [key: string]: string[] } = {};

  constructor(tableName: string, schema: string) {
    this.tableName = tableName;
    this.schema = schema;
  }

  addRelation<R>(key: string, relation: Relation<T, R>): ORM<T> {
    this.relations[key] = relation;
    return this;
  }

  async findAll(options: FindOptions = {}): Promise<T[]> {
    const conn = await getConnection(this.schema);
    let query = `SELECT ${await this.getColumnsWithAlias(
      this.schema,
      this.tableName
    )}`;

    if (options.with) {
      const joins = await this.buildJoinClauses(options.with);
      if (joins) {
        query += joins.fields.length
          ? `, ${joins.fields.join(', ')} FROM ${this.schema}.${
              this.tableName
            } ${joins.clauses.join(' ')}`
          : ` FROM ${this.schema}.${this.tableName} ${joins.clauses.join(' ')}`;
      }
    } else {
      query += ` FROM ${this.schema}.${this.tableName}`;
    }

    const rows = await conn.query(query);
    conn.end();

    return this.processResults(rows, options.with || {});
  }

  private async buildJoinClauses(withOptions: { [relation: string]: boolean }) {
    const joinClauses = [];
    const fields = [];

    for (const key of Object.keys(this.relations)) {
      if (withOptions[key]) {
        const relation = this.relations[key];
        const relatedTable = `${relation.relatedOrm.schema}.${relation.relatedOrm.tableName}`;

        if (
          relation.type === 'one-to-many' ||
          relation.type === 'many-to-one'
        ) {
          joinClauses.push(
            `LEFT JOIN ${relatedTable} ON ${this.schema}.${
              this.tableName
            }.${String(relation.primaryKey || 'id')} = ${relatedTable}.${String(
              relation.foreignKey
            )}`
          );
          fields.push(
            await this.getColumnsWithAlias(
              relation.relatedOrm.schema,
              relation.relatedOrm.tableName,
              key
            )
          );
        } else if (relation.type === 'many-to-many') {
          const joinTable = `${this.schema}.${relation.joinTable}`;
          joinClauses.push(
            `LEFT JOIN ${joinTable} ON ${this.schema}.${
              this.tableName
            }.${String(relation.primaryKey || 'id')} = ${joinTable}.${String(
              relation.joinForeignKey
            )}`
          );
          joinClauses.push(
            `LEFT JOIN ${relatedTable} ON ${joinTable}.${String(
              relation.foreignKey
            )} = ${relatedTable}.id`
          );
          fields.push(
            await this.getColumnsWithAlias(
              relation.relatedOrm.schema,
              relation.relatedOrm.tableName,
              key
            )
          );
        }
      }
    }

    return { clauses: joinClauses, fields };
  }

  private async getColumnsWithAlias(
    schema: string,
    tableName: string,
    prefix?: string
  ): Promise<string> {
    if (!this.columnCache[`${schema}.${tableName}`]) {
      this.columnCache[`${schema}.${tableName}`] = await getColumnNames(
        schema,
        tableName
      );
    }

    return this.columnCache[`${schema}.${tableName}`]
      .map(
        (col) =>
          `${schema}.${tableName}.${col} as ${prefix ? `${prefix}_` : ''}${col}`
      )
      .join(', ');
  }

  private async processResults(
    rows: any[],
    withOptions: { [relation: string]: boolean }
  ): Promise<T[]> {
    const results: any[] = [];
    const resultMap: { [key: string]: any } = {};

    for (const row of rows) {
      const mainKey = row.id;
      if (!resultMap[mainKey]) {
        resultMap[mainKey] = { id: row.id };
        for (const key of Object.keys(row)) {
          if (!key.includes('_')) {
            resultMap[mainKey][key] = row[key];
          }
        }
        for (const key of Object.keys(this.relations)) {
          if (withOptions[key]) {
            resultMap[mainKey][key] = [];
          }
        }
        results.push(resultMap[mainKey]);
      }

      for (const key of Object.keys(this.relations)) {
        if (withOptions[key]) {
          const relatedEntity = this.extractRelatedEntity(row, key);
          if (relatedEntity) {
            resultMap[mainKey][key].push(relatedEntity);
          }
        }
      }
    }

    // Handle many-to-many relationship entities
    for (const mainEntity of results) {
      for (const relationKey of Object.keys(this.relations)) {
        const relation = this.relations[relationKey];
        if (relation.type === 'many-to-many' && withOptions[relationKey]) {
          const relatedEntities = mainEntity[relationKey].reduce(
            (acc: any, entity: any) => {
              if (!acc.some((e: any) => e.id === entity.id)) {
                acc.push(entity);
              }
              return acc;
            },
            []
          );
          mainEntity[relationKey] = relatedEntities;
        }
      }
    }

    return results;
  }

  private extractRelatedEntity(row: any, prefix: string) {
    const relatedEntity: any = {};
    let hasValues = false;
    for (const key of Object.keys(row)) {
      if (key.startsWith(`${prefix}_`)) {
        const relatedKey = key.substring(prefix.length + 1);
        relatedEntity[relatedKey] = row[key];
        if (row[key] !== null) {
          hasValues = true;
        }
      }
    }
    return hasValues ? relatedEntity : null;
  }

  async findById(
    id: number,
    options: FindOptions = {}
  ): Promise<T | undefined> {
    const queryBuilder = new QueryBuilder<T>(this.tableName);
    queryBuilder.where(
      `${this.schema}.${this.tableName}.id` as keyof T,
      '=',
      id
    );
    const results = await this.find(queryBuilder, options);
    return results.length > 0 ? results[0] : undefined;
  }

  async find(
    queryBuilder: QueryBuilder<T>,
    options: FindOptions = {}
  ): Promise<T[]> {
    const conn = await getConnection(this.schema);
    let query = queryBuilder.build();

    query = query.replace(
      `FROM ${this.tableName}`,
      `FROM ${this.schema}.${this.tableName}`
    );

    if (options.with) {
      const joins = await this.buildJoinClauses(options.with);
      if (joins) {
        query = query.replace(
          `FROM ${this.schema}.${this.tableName}`,
          `FROM ${this.schema}.${this.tableName} ${joins.clauses.join(' ')}`
        );
        query = query.replace(
          '*',
          `${this.schema}.${this.tableName}.*, ${joins.fields.join(', ')}`
        );
      }
    }

    const values = queryBuilder.getValues();
    const rows = await conn.query(query, values);
    conn.end();

    return this.processResults(rows, options.with || {});
  }
}

export default ORM;
