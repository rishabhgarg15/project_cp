const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VideoSchema = new Schema({
    vLink: String,
    name: String,
    fieldname: String
});

const VideoLink = mongoose.model('VideoLink', VideoSchema);

module.exports = VideoLink;