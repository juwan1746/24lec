var mongoose = require('mongoose');

var reviewSchema = new mongoose.Schema({
  author: String,
  rating: {type: Number, required: true, min: 0, max: 5},
  reviewText: String,
  createdOn: {type: Date, default: Date.now}

});

var openingTimeSchema = new mongoose.Schema({
  days: {type: String},
  opening: String,
  closing: String,
  closed: {type: Boolean}
});

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: String,
  rating: {
    type: Number,
    'default': 0,
    min: 0,
    max: 5
  },
  facilities: [String],
  coords: {
    type: { type: String },
    coordinates: [Number]
  },
  openingTimes: [openingTimeSchema],
  reviews: [reviewSchema]
});




module.exports = mongoose.model('Location', locationSchema);