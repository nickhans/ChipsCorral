CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  username varchar(25) NOT NULL UNIQUE,
  admin BOOLEAN NOT NULL DEFAULT FALSE,
  subbed_threads INTEGER[]
);