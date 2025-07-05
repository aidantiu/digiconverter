// This file serves as an entry point for the models in the application.
const User = require('./user');
const Conversion = require('./conversion');

// Exporting the models for use in other parts of the application
module.exports = {
  User,
  Conversion
};
