const mongoose = require('mongoose');
require('mongoose-type-email');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email: {
        type: mongoose.SchemaTypes.Email,
        required: true,
        index: { uniquie: true }
    },
    password: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
});

const User = mongoose.model('User', UserSchema);
module.exports = User;