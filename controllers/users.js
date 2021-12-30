const usersRouter = require("express").Router();
require("dotenv").config();
const User = require("../models/user");
const Image = require("../models/image");
const bcrypt = require("bcrypt");
const auth = require("../middleware/auth");
const { upload, deleteFromAws } = require("./Helpers/AwsRequests");
const { body, validationResult } = require("express-validator");

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

// delete folder route - delete images inside folders as well
usersRouter.delete("/folders/delete", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const folder = req.body.folderName;

    if (user._id) {
      const removeFolderImages = await Image.find({ folder: folder });

      const imagesToDelete = removeFolderImages.map(async (image) => {
        const key = image.key;

        const deleteInAws = await deleteFromAws(key);
        // this is used to remove the imageId from the user images array
        const deleteUserImage = await User.findOneAndUpdate(
          { _id: userId },
          { $pull: { images: image._id } }
        );
        const deleteImage = await Image.findByIdAndDelete(image._id); // delete the image entry
      });

      const deleteFolderFromUser = await User.findOneAndUpdate(
        { _id: userId },
        { $pull: { folders: folder } }
      );

      res.json("Folder successfully deleted");
    }
  } catch (error) {
    res.status(401).json(error);
  }
});

// Register endpoint
usersRouter.post(
  "/",
  body("username").isLength({ min: 3 }),
  body("email").isEmail(),
  body("password").isLength({ min: 7 }),
  async (req, res) => {
    const errors = validationResult(req);

    try {
      if (!errors.isEmpty()) {
        return res.status(400).json("an error occured");
      }

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

      const savedUser = await user.save(user);

      res.json(savedUser);
    } catch (error) {
      res.status(400).json("Error creating user. Username/Email is already taken.");
    }
  }
);

module.exports = usersRouter;
