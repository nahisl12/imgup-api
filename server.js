const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
dotenv.config();

app.post("/register", async (req, res) => {
  try {
    // get login data from req
    const data = req.body;

    // encrypt password here using bcrypt

    // create user object with all user data
    const user = {
      username: req.body.loginUser,
      password: req.body.loginPassword,
      id: 0,
      joined: Date(),
    };

    // connect to mongo

    // save do whatever is needed to .save to the mongodb

    // send a response saying if success or failure
  } catch (error) {
    res.status(200).send(error);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`app started on port ${process.env.PORT}`);
});
