var mongoose = require('mongoose');

var TaskSchema = new mongoose.Schema({
    
    name: String,
    description: String,
    hours: Number,
    takers: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    organization: {type: mongoose.Schema.Types.ObjectId, ref: 'Organization'}
});


TaskSchema.methods.edit = function(edits,cb){
        
        console.log(edits);
        
        this.name = edits.name;
    

        this.description = edits.description;
    

        this.hours = edits.hours;
    
    
        this.save(cb);
};

mongoose.model('Task', TaskSchema);