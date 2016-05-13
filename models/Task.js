var mongoose = require('mongoose');

var TaskSchema = new mongoose.Schema({
    
    name: String,
    description: String,
    hours: Number,
    components: [{type: mongoose.Schema.Types.ObjectId, ref: 'TaskComponent'}],
    takers: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    organization: {type: mongoose.Schema.Types.ObjectId, ref: 'Organization'},
    taken: Boolean
});


TaskSchema.methods.edit = function(edits,cb){
        
        
        this.name = edits.name;
    

        this.description = edits.description;
    

        this.hours = edits.hours;
    
    
        this.save(cb);
};

TaskSchema.methods.setTaken = function(cb){
        
        
        this.taken = true;
    
    
        this.save(cb);
};

mongoose.model('Task', TaskSchema);