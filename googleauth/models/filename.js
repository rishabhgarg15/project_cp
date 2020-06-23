const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fileSchema = new Schema({
    fname: String,
    name:String,
    fieldname: String
});

const FileName = mongoose.model('FileName', fileSchema);

module.exports = FileName;