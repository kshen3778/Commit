var mongoose = require('mongoose');

var TaskRequestSchema = new mongoose.Schema({
    
    taskid: String,
    taskname: String,
    takername: String,
    email: String,
    school: String,
    orgname: String,
    organization: {type: mongoose.Schema.Types.ObjectId, ref: 'Organization'}
});


TaskRequestSchema.methods.edit = function(edits,cb){
        
        //Edit a request as long as it hasn't been approved yet
};

mongoose.model('TaskRequest', TaskRequestSchema);