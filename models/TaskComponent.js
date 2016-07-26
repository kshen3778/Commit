var mongoose = require('mongoose');

var TaskComponentSchema = new mongoose.Schema({

    task: {type: mongoose.Schema.Types.ObjectId, ref: 'Task'},
    name: String,
    requirements: String,
    esthours: Number,
    acthours: Number,
    due: Date,
    completed: Boolean,
    ontime: Boolean,
});

mongoose.model('TaskComponent', TaskComponentSchema);
