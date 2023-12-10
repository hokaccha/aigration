import fs from "fs";
import { OpenAI } from "openai";
import { Client } from "pg";

const pg = new Client({
  user: "postgres",
  host: "localhost",
  database: "exampledb",
});

const configuration = {
  apiKey: process.env.OPEN_AI_API_KEY,
  organization: process.env.OPEN_AI_ORG_ID,
};
const openai = new OpenAI(configuration);

async function sendPromptToOpenAI(prompt) {
  return openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-3.5-turbo",
    stream: false,
  });
}

async function generateAlterTableStatements(currentSchema, newSchema) {
  const prompt = `
Given the current PostgreSQL schema:

${currentSchema}

And the new desired schema:

${newSchema}

Just provide the ALTER TABLE statements without any additional explanation or commentary.
`;
  const response = await sendPromptToOpenAI(prompt);
  return response.choices[0].message.content;
}

async function getCurrentSchema() {
  await pg.connect();
  const res = await pg.query(`
    SELECT
      table_schema,
      table_name,
      column_name,
      data_type,
      is_nullable
    FROM
      information_schema.columns
    WHERE
      table_schema NOT IN ('pg_catalog', 'information_schema', 'information_schema')
    ORDER BY
      table_schema,
      table_name,
      ordinal_position;
  `);
  await pg.end();

  const schemaByTable: {
    tableName: string;
    columns: string[];
  }[] = res.rows.reduce((acc, row) => {
    const tableName = row.table_name;
    if (!acc[tableName]) {
      acc[tableName] = {
        tableName,
        columns: [],
      };
    }
    acc[tableName].columns.push(
      `${row.column_name} ${row.data_type}${
        row.is_nullable === "NO" ? " NOT NULL" : ""
      }`
    );
    return acc;
  }, {});

  const createTableStatements = Object.values(schemaByTable)
    .map((table) => {
      return `CREATE TABLE "${table.tableName}" (\n  ${table.columns.join(
        ",\n  "
      )}\n);`;
    })
    .join("\n\n");

  return createTableStatements;
}

(async () => {
  const currentSchema = await getCurrentSchema();
  const newSchema = fs.readFileSync("./schema.sql", "utf8");

  const alterStatements = await generateAlterTableStatements(
    currentSchema,
    newSchema
  );

  console.log(alterStatements);
})();
