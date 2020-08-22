const winston = require("winston");
const mongoose = require("mongoose");
const config = require("config");
const { debug } = require("winston");
module.exports = function () {
  const db = config.get("db");
  mongoose
    .connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then(() => console.log(`Connected to ${db}....`));
};
