// This file imports and exports commonly used dependencies in the application
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const express = require('express');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

module.exports = {
  mongoose,
  bcrypt,
  express,
  dotenv,
  jwt
};