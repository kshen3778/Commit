var mongoose = require('mongoose');

var TaskRequestSchema = new mongoose.Schema({

    taskid: String,
    taskname: String,
    orgname: String,
    //takername: String,
    taker: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    //email: String,
    //school: String,
    //phone: String,
    info: String,
    approved: Boolean,
    organization: {type: mongoose.Schema.Types.ObjectId, ref: 'Organization'}
});


TaskRequestSchema.methods.edit = function(edits,cb){

        //Edit a request as long as it hasn't been approved yet
        this.info = edits.info;
        this.save(cb);
};

TaskRequestSchema.methods.approve = function(cb){
    this.approved = true;
    this.save(cb);
};

mongoose.model('TaskRequest', TaskRequestSchema);
