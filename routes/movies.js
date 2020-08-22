const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const { Movie, validate } = require("../models/movie");
const { Genre } = require("../models/genre");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/movies/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/png" || file.mimetype === "image/jpeg") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
});

router.get("/", async (req, res) => {
  const movies = await Movie.find().select("-__v").sort("name movieImg");
  res.send(movies);
});

router.get("/:id", [auth, admin], async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).select("-__v");
    res.send(movie);
  } catch (error) {
    return res.status(404).send("Movie does not exist");
  }
});

router.post("/", [auth, admin, upload.single("movieImg")], async (req, res) => {
  const { error } = validate(req.body);

  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  const genre = await Genre.findById(req.body.genreId);
  if (!genre) return res.status(400).send("Invalid genre.");

  const movie = new Movie({
    title: req.body.title,
    genre: {
      _id: genre._id,
      name: genre.name,
    },
    numberInStock: req.body.numberInStock,
    dailyRentalRate: req.body.dailyRentalRate,
    imdbRating: req.body.imdbRating,
    cast: req.body.cast,
    description: req.body.description,
    movieImg: req.file.path,
  });
  await movie.save();

  res.send(movie);
});

router.put(
  "/:id",
  [auth, admin, upload.single("movieImg")],
  async (req, res) => {
    const { error } = validate(req.body);

    if (error) {
      return res.status(400).send(error.details[0].message);
    }

    try {
      var genre = await Genre.findById(req.body.genreId);
    } catch (error) {
      return res.status(400).send("Invalid genre.");
    }

    console.log(genre);

    try {
      const movie = await Movie.findByIdAndUpdate(
        req.params.id,
        {
          title: req.body.title,
          genre: {
            _id: genre._id,
            name: genre.name,
          },
          numberInStock: req.body.numberInStock,
          dailyRentalRate: req.body.dailyRentalRate,
          imdbRating: req.body.imdbRating,
          cast: req.body.cast,
          description: req.body.description,
          movieImg: req.file.path,
        },
        { new: true }
      );
      res.send(movie);
    } catch (error) {
      return res.status(404).send("The movie with the given ID was not found.");
    }
  }
);

router.delete("/:id", [auth, admin], async (req, res) => {
  try {
    const movie = await Movie.findByIdAndRemove(req.params.id);
    res.send(movie);
  } catch (error) {
    return res.status(404).send("The movie with the given ID was not found.");
  }
});

module.exports = router;
