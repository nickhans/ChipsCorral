CREATE TABLE IF NOT EXISTS comments (
  comment_id SERIAL PRIMARY KEY NOT NULL,
  content TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  post_id INTEGER NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0
);