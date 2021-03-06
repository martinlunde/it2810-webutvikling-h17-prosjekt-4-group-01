const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MovieSchema = new Schema({
    _id: {type: String},
    title: { type: String, default: "undefined"},
    year: {type: Number, default: 0},
    runtime: {type: String, default: 'undefined'},
    genre: {type: Array, default: 'undefined'},
    director: {type: Array, default: 'undefined'},
    actors: {type: Array, default: 'undefined'},
    plot: {type: String, default: 'undefined'},
    poster: {type: String, default: 'undefined'},
    readMore: { type: String, default: "undefined"},
});

//Todo: User, history
const UserSchema = new Schema({
    _id: {type: String},
    username: { type: String, required: true},
    password: { type: String, required: true},
    searchHistory: { type: Array, default: []},
    favorites: { type: Array, default: []}
});

const Movie = mongoose.model('Movie', MovieSchema);
const User = mongoose.model('User', UserSchema);

module.exports = {Movie, User};
