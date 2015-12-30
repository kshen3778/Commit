var mongoose = require('mongoose');

var TaskRequestSchema = new mongoose.Schema({
    
    taskid: String,
    taskname: String,
    orgname: String,
    takername: String,
    email: String,
    school: String,
    organization: {type: mongoose.Schema.Types.ObjectId, ref: 'Organization'}
});


TaskRequestSchema.methods.edit = function(edits,cb){
        
        //Edit a request as long as it hasn't been approved yet
        this.takername = edits.takername;
        this.email = edits.email;
        this.school = edits.school;
};

mongoose.model('TaskRequest', TaskRequestSchema);