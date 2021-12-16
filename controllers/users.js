const usersRouter = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");

// Register endpoint
usersRouter.post("/", async (req, res) => {
  try {
    // get login data from req
    const data = req.body;
    console.log(data);
    const password = data.password;
    // encrypt password here using bcrypt
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    // create user object with all user data
    const user = new User({
      username: data.username,
      email: data.email,
      hash: hash,
      joined: Date.now(),
    });

    // connect to mongo
    const savedUser = await user.save(user);
    // save do whatever is needed to .save to the mongodb
    res.json(savedUser);
    // send a response saying if success or failure
  } catch (error) {
    res.status(400).json("Error creating user");
  }
});

module.exports = usersRouter;
