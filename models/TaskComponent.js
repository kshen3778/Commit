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

TaskComponentSchema.methods.edit = function(edits,cb){


        this.requirements = edits.requirements;


        this.due = edits.due;


        this.esthours = edits.esthours;


        this.save(cb);
};

mongoose.model('TaskComponent', TaskComponentSchema);
