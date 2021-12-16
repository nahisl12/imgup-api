const loginRouter = require("express").Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

loginRouter.post("/", async (req, res) => {
  try {
    // get username/password from request data
    const data = req.body;
    // check that the data matches with an user inside mongodb - compare the usernames and passwords
    const user = await User.findOne({ username: data.username }); // Query the database to see if a username matches
    if (user !== null) {
      await bcrypt.compare(data.password, user.hash); // compare the password sent with the post request with the hash in database
    } else {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const userToSign = {
      username: user.username,
      id: user._id,
    };

    const accessToken = jwt.sign(userToSign, process.env.TOKEN_SECRET);

    res.status(200).json({ accessToken: accessToken });
  } catch (error) {
    res.status(401).json("Invalid Username or Password");
  }
});

module.exports = loginRouter;
