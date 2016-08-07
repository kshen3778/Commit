var mongoose = require('mongoose');

var TaskComponentSchema = new mongoose.Schema({

    task: {type: mongoose.Schema.Types.ObjectId, ref: 'Task'},
    name: String,
    requirements: String,
    esthours: Number,
    acthours: Number,
    due: Date,
    completed: Boolean,
    submission: String,
    ontime: Boolean,
});

TaskComponentSchema.methods.edit = function(edits,cb){

        if(edits.requirements != ""){
          this.requirements = edits.requirements;
        }
        if(edits.due != null){
          this.due = edits.due;
        }
        if(edits.esthours != null){
          this.esthours = edits.esthours;
        }
        if(edits.submission != ""){
          this.submission = edits.submission;
        }
        if(edits.acthours != null){
          this.acthours = edits.acthours;
        }

        this.save(cb);
};

mongoose.model('TaskComponent', TaskComponentSchema);
