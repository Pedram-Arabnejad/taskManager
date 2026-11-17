-- The dev database (taskflow) is created by the postgres image itself.
-- Integration tests use a separate database so a test run never touches dev data.
CREATE DATABASE taskflow_test OWNER app;
