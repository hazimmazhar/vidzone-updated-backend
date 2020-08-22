const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const { Rental, validate } = require("../models/rental");
const { Movie } = require("../models/movie");
const { Customer } = require("../models/customer");
const Fawn = require("fawn");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

Fawn.init(mongoose);

router.get("/", [auth, admin], async (req, res) => {
  const rentals = await Rental.find().sort("-dateOut");
  res.send(rentals);
});

router.get("/:id", [auth, admin], async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).select("-__v");
    res.send(rental);
  } catch (error) {
    return res.status(404).send("Rental does not exist");
  }
});

router.post("/", [auth, admin], async (req, res) => {
  const { error } = validate(req.body);

  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  const customer = await Customer.findById(req.body.customerId);
  if (!customer) return res.status(400).send("Invalid customer.");

  const movie = await Movie.findById(req.body.movieId);
  if (!movie) return res.status(400).send("Invalid movie.");

  const rentalInDb = await Rental.lookup(req.body.customerId, req.body.movieId);

  if (rentalInDb) return res.status(400).send("Rental already exists");

  if (movie.numberInStock === 0) return res.status(404).send("Movie not found");

  let rental = new Rental({
    customer: {
      _id: customer._id,
      name: customer.name,
      phone: customer.phone,
    },
    movie: {
      _id: movie._id,
      title: movie.title,
      dailyRentalRate: movie.dailyRentalRate,
    },
  });

  try {
    new Fawn.Task()
      .save("rentals", rental)
      .update(
        "movies",
        { _id: movie._id },
        {
          $inc: { numberInStock: -1 },
        }
      )
      .run();

    res.send(rental);
  } catch (error) {
    res.status(500).send("Something failed");
  }
});

router.delete("/:id", [auth, admin], async (req, res) => {
  try {
    const rental = await Rental.findByIdAndRemove(req.params.id);
    res.send(rental);
  } catch (error) {
    return res.status(404).send("The customer was not found");
  }
});

module.exports = router;
