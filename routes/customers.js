const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const { Customer, validate } = require("../models/customer");
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

router.get("/", [auth, admin], async (req, res) => {
  const customers = await Customer.find().sort("name");
  res.send(customers);
});

router.get("/:id", [auth, admin], async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    res.send(customer);
  } catch (error) {
    return res.status(404).send("Customer does not exist");
  }
});

router.post("/", [auth, admin], async (req, res) => {
  const { error } = validate(req.body);

  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  const customer = await new Customer({
    name: req.body.name,
    phone: req.body.phone,
    email: req.body.email,
    address: req.body.address,
  });
  await customer.save();

  res.send(customer);
});

router.put("/:id", [auth, admin], async (req, res) => {
  const { error } = validate(req.body);

  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        address: req.body.address,
      },
      { new: true }
    );
    res.send(customer);
  } catch (error) {
    return res.status(404).send("The customer was not found");
  }
});

router.delete("/:id", [auth, admin], async (req, res) => {
  try {
    const customer = await Customer.findByIdAndRemove(req.params.id);
    res.send(customer);
  } catch (error) {
    return res.status(404).send("The customer was not found");
  }
});

module.exports = router;
