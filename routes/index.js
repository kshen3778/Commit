var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');
var User = mongoose.model('User');
var Organization = mongoose.model('Organization');
var Task = mongoose.model('Task');
var TaskRequest = mongoose.model('TaskRequest');

var router = express.Router();

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//user's dashboard
router.get('/dashboard', auth, function(req,res,next){
        User.findOne({email: req.payload.user.email}, function(err, user){
        
            if(err){return err;}
            
            user.populate('tasks', function(err, tasks){
                if(err){
                    return next(err);
                }
                res.json(tasks);
            });
        });
    
});

//get all task requests
router.get('/gettaskrequests', auth, function(req,res,next){
    User.findOne({email: req.payload.user.email}, function(err, user){
       if(err){
           return err;
       } 
       
       //one to Many Normalized schema
       TaskRequest.find({taker: user._id}, function(err, taskrequests){
          if(err){
              return err;
          }
          res.json(taskrequests);
       });
       /*
          user.populate('taskrequests', function(err, user){
              if(err){
                  return next(err);
              } 
              
              console.log(JSON.stringify(user.taskrequests));
              res.json(user.taskrequests);
          });
          */
       
      
    });
});

//browse/search tasks
router.get('/browse/tasks', function(req,res,next){
   Task.find({},function(err, tasks){
     if(err){ return next(err); }
     res.json(tasks);
   });
});

router.get('/orgdashboard', auth, function(req,res,next){
    Organization.findOne({email: req.payload.org.email}, function(err, org){
        
            if(err){return err;}
            
            //get the organization's tasks
            org.populate('tasks', function(err, tasks){
                if(err){
                    return next(err);
                }
                res.json(tasks.tasks);
            });
    });
});

//create a task
router.post('/tasks', auth, function(req, res, next){

   var task = new Task(req.body); //create a new post with user input info
   task.organization = req.payload.org;
   
   task.save(function(err, task){
      if(err){ 
          return next(err); 
      } 
      Organization.update({email: req.payload.email},{$addToSet:{tasks: task}},function(err, org){
            if(err){
                return next(err);
            }
            res.json(task);
      });
   });
   
});

//edit specific task
router.put('/tasks/:task/edit', auth, function(req,res,next){
   req.task.edit(req.body.edits, function(err, task){
       if(err){
           return next(err);
       }
       //update the corresponding taskrequests
       TaskRequest.update({taskid: task._id},{$set: {taskname: req.body.edits.name}}, function(err, taskrequest){
          if(err){
              return err;
          }
          res.json(task);
          
       });
      
   });
   
   
});

//delete a specific task
router.delete('/tasks/:task/delete', auth, function(req, res, next){
    Task.findById(req.params.task).exec(function(err, doc) {
            if (err || !doc) {
                res.statusCode = 404;
                res.send({});
            } else {
                doc.remove(function(err) {
                    if (err) {
                        res.statusCode = 403;
                        res.send(err);
                    } else {
                        res.send({});

                    }
                });
            }
    }); 
});

//edit a task request
router.put('/taskrequests/:taskrequest/edit', auth, function(req,res,next){
   req.taskrequest.edit(req.body.edits, function(err, taskrequest){
     if(err){
         return next(err);
     }  
     res.json(taskrequest);
   });
});

//delete a taskrequest
router.delete('/taskrequests/:taskrequest/delete', auth, function(req,res,next){
   TaskRequest.findById(req.params.taskrequest).exec(function(err, doc){
      if(err || !doc){
          res.statusCode = 404;
          res.send({});
      }else{
          doc.remove(function(err){
             if(err){
                 res.statusCode = 403;
                 res.send(err);
             }else{
                 res.send({});
             } 
          });
      }
   }); 
});

//submit a task request
router.post('/tasks/:task/submit', auth, function(req, res, next){
    Task.findById(req.params.task).exec(function(err, doc) {
        if (err || !doc) {
            res.statusCode = 404;
            res.send({});
        } else {
            var tr = new TaskRequest();
            tr.taskid = req.params.task;
            tr.taskname = doc.name;
            tr.takername = req.body.name;
            tr.email = req.body.email;
            tr.school = req.body.school;
            tr.organization = doc.organization;
            User.findOne({email: req.payload.email}, function(err, user){
                if(err){
                    return next(err);
                }
                
                tr.taker = user._id;
                
                Organization.findById(doc.organization).exec(function(err, orgdoc) {
                    if (err || !orgdoc) {
                        res.statusCode = 404;
                        res.send({});
                    }else{
                        tr.orgname = orgdoc.name;
                        tr.save(function(err, trequest){
                            if(err){ 
                                return next(err); 
                            } 
                            User.update({email: req.payload.email},{$addToSet:{taskrequests: trequest}},function(err, user){
                                if(err){
                                    return next(err);
                                }
        
                                console.log("trequest: " + JSON.stringify(trequest));
                                res.json(trequest);
                            });
                        });
                    }
                });
            
            });
        }
    });

});

//preload tasks
router.param('task', function(req,res,next,id){
   var query = Task.findById(id); //find the task
   
   // try to get the post details from the Tasks model and attach it to the request object
   query.exec(function(err, task){
      if(err){
          return next(err);
      }
      if(!task){
          return next(new Error('Can\'t find task'));
      }
      
      req.task = task;
      return next();
   });
});

//preload taskrequests
router.param('taskrequest', function(req,res,next,id){
    var query = TaskRequest.findById(id); //find the task
   
   // try to get the post details from the Tasks model and attach it to the request object
   query.exec(function(err, taskrequest){
      if(err){
          return next(err);
      }
      if(!taskrequest){
          return next(new Error('Can\'t find task'));
      }
      
      req.taskrequest = taskrequest;
      return next();
   });
    
});

//retrieve a specific taskrequest
router.get('/taskrequests/:taskrequest', function(req, res, next){
    TaskRequest.findById(req.taskrequest, function(err, tr){
        if(err){
            return next(err);
        }
        res.json(tr);
    });
});

//retrieve a specific task
router.get('/tasks/:task', function(req,res,next){
   var info = new Array();
   Organization.findById(req.task.organization, function (err, org) {
      if(err){
          return next(err);
      }
      info.push(req.task);
      info.push(org.name);
      res.json(info);
   });
});

//user registration
router.post('/register', function(req, res, next){
    console.log("entering register route");
   if(!req.body.email || !req.body.password){
       return res.status(400).json({message: 'Please fill out all fields'});
   } 
   
   var user = new User();
   
   user.email = req.body.email;
   user.type = "user";
   user.setPassword(req.body.password);
   user.save(function(err){
       if(err){
           return next(err); 
       }
       return res.json({token: user.generateJWT()});
   });
});

//organization registration
router.post('/registerorg', function(req, res, next){
   if(!req.body.email || !req.body.password){
       return res.status(400).json({message: 'Please fill out all fields'});
   }
   
   var org = new Organization();
   
   org.name = req.body.name;
   org.email = req.body.email;
   org.desc = req.body.desc;
   org.city = req.body.city;
   org.country = req.body.country;
   org.type = "organization";
   org.setPassword(req.body.password);
   org.save(function(err){
      if(err){
          return next(err);
      }
      return res.json({token: org.generateJWT()});
   });
   
});

//user login
router.post('/login', function(req,res,next){
   if(!req.body.email || !req.body.password){
       return res.status(400).json({message: 'Please fill out all required fields'});
   }
   
   passport.authenticate('user-local', function(err, user, info){
       if(err){ 
           return next(err); 
       }
       console.log(user);
       console.log(info);
       if(user){
           return res.json({token: user.generateJWT()});
       }else{
           return res.status(401).json(info);
       }
   })(req,res,next);
});

//organization login
router.post('/loginorg', function(req, res, next){
    if(!req.body.email || !req.body.password){
        return res.status(400).json({message: 'Please fill out all fields'});
    }
    
    passport.authenticate('org-local', function(err, org, info){
        if(err){
            return next(err);
        }
        if(org){
            return res.json({token: org.generateJWT()});
        }else{
            return res.status(401).json(info);
        }
    })(req,res,next);
})

module.exports = router;
