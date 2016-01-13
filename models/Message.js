var mongoose = require('mongoose');

var MessageSchema = new mongoose.Schema({
    
    message: String,
    to_id: String,
    from_id: String
});

mongoose.model('Message', MessageSchema);