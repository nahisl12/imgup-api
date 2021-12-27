const usersRouter = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const auth = require("../middleware/auth");

// get folders the user has from user db
usersRouter.get("/folders", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId); // finds the user in db

    if (user._id) {
      // if the user exists then do this
      const albums = user.folders; // the data we want to send back
      res.json(albums);
    }
  } catch (error) {
    res.json(error);
  }
});

usersRouter.put("/folders/new", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (user._id) {
      user.folders = user.folders.concat(req.body.folder);
      await user.save();

      res.status(200).json(user.folders);
    }
  } catch (error) {
    console.log(error);
  }
});

// delete folder route
usersRouter.delete("/folders/delete", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const folder = req.body.folderName;

    if (user._id) {
      const deleteFolderFromUser = await User.findOneAndUpdate(
        { _id: userId },
        { $pull: { folders: folder } }
      ); // this is used to remove the imageId from the user images array

      res.json("Folder successfully deleted");
    }
  } catch (error) {
    console.log(error);
  }
});

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
