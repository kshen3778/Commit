var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');
var User = mongoose.model('User');
var Organization = mongoose.model('Organization');
var Task = mongoose.model('Task');

var router = express.Router();

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

/* GET home page. */
router.get('/', function(req, res, next) {
  //console.log(req.payload);
  res.render('index', { title: 'Express' });
  //res.redirect("/orgdashboard");
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

//browse/search tasks
router.get('/browse/tasks', function(req,res,next){
   Task.find({},function(err, tasks){
     if(err){ return next(err); }
     console.log("All Tasks: " + JSON.stringify(tasks));
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

//edit specific location
router.put('/tasks/:task/edit', auth, function(req,res,next){
   console.log("Request edit data: " + JSON.stringify(req.body));
   req.task.edit(req.body.edits, function(err, task){
       if(err){
           return next(err);
       }
       console.log("Return data: " + JSON.stringify(task));
       res.json(task);
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

//preload tasks
router.param('task', function(req,res,next,id){
   var query = Task.findById(id); //find the post
   
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
