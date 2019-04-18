const express = require("express");
const nunjucks = require("nunjucks");
const cors = require("cors");

require("dotenv").config();
const pgp = require("pg-promise")();
const bcrypt = require("bcrypt");
const salt = 10;

const db = pgp(process.env.DATABASE_URL);

// initialize express
const app = express();

// initialize express body-parsing for error logging
app.options("*", cors());
app.use(express.static(__dirname + "/"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

nunjucks.configure("views", {
  autoescape: true,
  express: app
});

// get request for /
app.get("/", (req, res) => {
  res.render("pages/welcome.html");
});

app.get("/signup", (req, res) => {
  res.render("pages/signup.html");
});

app.get("/login", (req, res) => {
  res.render("pages/login.html");
});

app.get("/home", (req, res) => {
  res.render("pages/home.html");
});

// test get functions for database
app.get("/test", (req, res) => {
  db.any("SELECT * FROM USERS;")
    .then(data => {
      res.status(200);
      res.send("Test passed: " + JSON.stringify(data));
    })
    .catch(err => {
      console.log(err);
      res.status(400);
      res.send("Test failed");
    });
});

// creating user
app.post("/user", (req, res) => {
  console.log(req.body.email);
  const user_info = req.body;
  console.log(`Attempting to create user ${user_info.username}`);

  if (user_info.password === undefined) {
    console.log("PASSWORD UNDEFINED");
    res.status(400);
    res.send("PASSWORD UNDEFINED");
    return;
  }

  bcrypt.hash(user_info.password, salt).then(hash => {
    db.one("SELECT * FROM users WHERE email = $1 OR username = $2;", [
      user_info.email,
      user_info.username
    ])
      .then(data => {
        console.log(data);
        res.status(400);
        if (
          data.email == user_info.email &&
          data.username == user_info.username
        ) {
          res.json({
            dev: `User with email: ${user_info.email} and with username: ${
              user_info.username
            } already exists`,
            message: "Username and email taken"
          });
        } else if (data.username == user_info.username) {
          res.json({
            dev: `User with username: ${user_info.username} already exists`,
            message: "Username taken"
          });
        } else {
          res.json({
            dev: `User with email: ${user_info.email} already exists`,
            message: "Email taken"
          });
        }
      })
      .catch(err => {
        console.error(err.received);
        if (err.received == 0) {
          db.any(
            "INSERT INTO users(email, password, username) VALUES ($1, $2, $3);",
            [user_info.email, hash, user_info.username]
          )
            .then(data => {
              console.log("SERVER: " + data);
              res.status(201);
              res.send(data);
            })
            .catch(err => {
              console.log("SERVER: " + err);
              res.status(400);
              res.send({ err });
            });
        }
      });
  });
});

// get user info
app.get("/user", (req, res) => {
  console.log(req.query.id);
  var query = `SELECT * FROM users WHERE user_id=${req.query.id} LIMIT 1`;
  db.any(query)
    .then(data => {
      console.log(data);
      res.status(200);
      if (typeof data[0] === undefined || data.length == 0) {
        throw `data undefined for user_id: ${req.query.id}`;
      } else {
        res.send(data[0]);
      }
    })
    .catch(err => {
      console.log(err);
      res.status(400);
      res.send({ err });
    });
});

// delete user
app.delete("/user", (req, res) => {
  console.log(req.query.id);
  db.any("SELECT * FROM users WHERE user_id=$1", [req.query.id])
    .then(data => {
      console.log(data);
      if (data !== undefined) {
        db.any("DELETE FROM users WHERE user_id=$1", [req.query.id])
          .then(data => {
            console.log(data);
            res.status(200);
            res.send(`User with id ${req.query.id} deleted`);
          })
          .catch(err => {
            console.log(err);
            res.status(400);
            res.send("User could not be deleted");
          });
      } else {
        throw `User with id ${req.query.id} does not exist`;
      }
    })
    .catch(err => {
      console.log(err);
      res.status(400);
      res.send({ err });
    });
});

// create post
app.post("/post", (req, res) => {
  const post_info = req.body;
  db.none(
    "INSERT INTO posts(title, content, user_id, thread_id) VALUES($1, $2, $3, $4);",
    [post_info.title, post_info.content, post_info.user_id, post_info.thread_id]
  )
    .then(data => {
      res.status(200);
      res.json({
        status: "Post successful"
      });
    })
    .catch(err => {
      console.log(err);
      res.status(400);
      res.json({
        status: "Post could not be created",
        error: err
      });
    });
});

// get post
app.get("/post", (req, res) => {
  db.one("SELECT * FROM posts WHERE post_id=$1;", [req.query.id])
    .then(data => {
      console.log(data);
      res.status(200);
      res.send(data);
    })
    .catch(err => {
      console.log(err);
      res.status(400);
      res.json({
        message: `Post with id: ${req.query.id} does not exist`
      });
    });
});

// delete post
app.delete("/post", (req, res) => {
  db.one("SELECT * FROM posts WHERE post_id=$1;", [req.query.id])
    .then(data => {
      db.none("DELETE FROM posts WHERE post_id=$1;", [req.query.id])
        .then(() => {
          res.status(200);
          res.json({
            dev: `Post with id: ${req.query.id} deleted`,
            message: "Post deleted",
            status: "Success"
          });
        })
        .catch(err => {
          console.log(err);
          res.status(400);
          res.send({ err });
        });
    })
    .catch(err => {
      console.log(err);
      res.status(400);
      res.send({ err });
    });
});

// start server
app.listen(process.env.PORT || 5000, () =>
  console.log(`listening on port ${PORT}`)
);