const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const usersRouter = require("./controllers/users");
const loginRouter = require("./controllers/login");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
dotenv.config();

mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Successfully connected to Mongoose"));

app.use("/api/users", usersRouter); // user/register endpoint
app.use("/api/login", loginRouter); // login endpoint

app.listen(process.env.PORT, () => {
  console.log(`app started on port ${process.env.PORT}`);
});
