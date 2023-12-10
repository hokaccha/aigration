# aigration

This is a PoC for a database migration tool using a generative AI.

## Usage

Write `schema.sql`.

```sql
CREATE TABLE "user" (
  id bigint NOT NULL,
  name text
);
```

Apply `schema.sql` to the database.

```
$ createdb -h localhost -U postgres exampledb
$ psql -h localhost -U postgres exampledb < schema.sql
```

Edit `schema.sql`.

```sql
CREATE TABLE "user" (
  id bigint NOT NULL,
  name text,
  age integer
);
```

Write `.env`

```
OPEN_AI_API_KEY=xxx
OPEN_AI_ORG_ID=xxx
```

Run `migrate`.

```
$ npm install
$ npm run -s migrate
ALTER TABLE "user" ADD COLUMN age integer;
```
