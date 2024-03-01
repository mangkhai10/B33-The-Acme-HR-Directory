// imports here for express and pg
const express = require("express");
const app = express();
const pg = require("pg");
// Initializing PostgreSQL client
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_employees_departments_db"
);

// Use the JSON parsing express method, and also activate logging with Morgan
app.use(express.json());
app.use(require("morgan")("dev"));

// Define API routes

app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM departments`
    const result = await client.query(SQL);
    res.send(result.rows);
  } catch (error) {
    next(error);
  }
});
app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM employees ORDER BY created_at DESC`
    const result = await client.query(SQL);
    res.send(result.rows);
  } catch (error) {
    next(error);
  }
});
// getting single employee
app.get("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM employees WHERE id = $1`;
    const result = await client.query(SQL, [req.params.id]);
    res.send(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL = `INSERT INTO employees(name, department_id) VALUES($1, $2) RETURNING *`;
    const result = await client.query(SQL, [req.body.name, req.body.department_id]);
    res.send(result.rows[0]);
  } catch (error) {}
});

app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `UPDATE employees SET name=$1, department_id=$2, updated_at= now WHERE id=$3 RETURNING *`;
    const result = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
      req.params.id
    ]);
    res.send(result.rows[0]);
  } catch (error) {
    next(error);
  }
});
app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE FROM employees WHERE id=$1`;
    const result = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});
// create your init function
const init = async () => {
  // Connect to the PostgreSQL database
  await client.connect();

  // SQL script to drop existing table, create a new one, and seed initial data
  let SQL = `
  DROP TABLE IF EXISTS employees;
  DROP TABLE IF EXISTS departments;

  CREATE TABLE departments(
  id SERIAL PRIMARY KEY,
  name VARCHAR(225) NOT NULL
  );

    CREATE TABLE employees(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    department_id INTEGER REFERENCES departments(id) NOT NULL
    );
    
  INSERT INTO departments(name) VALUES('Human Resources');
  INSERT INTO departments(name) VALUES('Engineering');
  INSERT INTO departments(name) VALUES('Security');
  INSERT INTO departments(name) VALUES('Sales');

  INSERT INTO employees(name, department_id) VALUES('Mike', (SELECT id FROM departments WHERE name='Human Resources'));
  INSERT INTO employees(name, department_id) VALUES('Bob', (SELECT id FROM departments WHERE name='Engineering'));
  INSERT INTO employees(name, department_id) VALUES('Jane', (SELECT id FROM departments WHERE name='Security'));
  INSERT INTO employees(name, department_id) VALUES('Alice', (SELECT id FROM departments WHERE name='Sales'));
`;

  // Execute SQL script
  await client.query(SQL);
  console.log("Tables created and data seeded");

  // Define the port to listen on, using either environment variable or default to 3000
  const port = process.env.PORT || 3000;
  // Start the Express server
  app.listen(port, () => console.log(`Listening on port ${port}`));
};

// init function invocation
init()
