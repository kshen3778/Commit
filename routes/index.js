var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');
var User = mongoose.model('User');
var Organization = mongoose.model('Organization');
var Task = mongoose.model('Task');
var TaskRequest = mongoose.model('TaskRequest');
var Message = mongoose.model('Message');
var TaskComponent = mongoose.model('TaskComponent');

var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');

var router = express.Router();

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

const emailPass = process.env.PASS;
const emailUser = process.env.USER;

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

router.get('/gettaskrequests/org', auth, function(req,res,next){
    Organization.findOne({email: req.payload.org.email}, function(err, org){
       if(err){
           return err;
       }

       //one to Many Normalized schema
       TaskRequest.find({organization: org._id}, function(err, taskrequests){
          if(err){
              return err;
          }
          res.json(taskrequests);
       });


    });
});

//browse/search tasks
router.get('/browse/tasks', function(req,res,next){
   Task.find({taken: false},function(err, tasks){
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
   task.taken = false;

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
            tr.approved = false;
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

//approve a task request (FIX AUTH PROBLEM)
router.put('/taskrequests/:taskrequest/approve',  function(req,res,next){
   console.log(req.params.taskrequest);
   console.log("approve 2");
   req.taskrequest.approve(function(err, taskrequest){
     if(err){
         console.log("error approving");
         return next(err);
     }

     Task.findOne(req.taskrequest.taskid, function(err, task){
        console.log(task);
        task.setTaken(function(err, takentask){
            console.log("task is now taken");
            res.json(taskrequest);
        });
     });
     //console.log("approved " + taskrequest);

   });
});

//is taskrequest approved
router.get('/taskrequests/:taskrequest/approved', auth, function(req,res,next){
   console.log("task request is approved");
   console.log(req.params.taskrequest);
   TaskRequest.findOne(req.params.taskrequest._id, function(err, taskrequest){
      if(err){
          console.log("error");
          return next(err);
      }
      console.log("isapproved " + taskrequest);
      res.send(taskrequest.approved);
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

//add a task component
router.post('/task/:task/addcomponent', auth, function(req,res,next){
    var tc = new TaskComponent();
    tc.task = req.params.task;
    tc.name = req.body.name;
    tc.description = req.body.description;
    tc.requirements = req.body.requirements;
    tc.hours = req.body.hours;
    tc.submitted = false;
    tc.completed = false;

    tc.save(function(err, taskcomp){
       if(err){
           return next(err);
       }
       return res.json(taskcomp);
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
   if(!req.body.email){
       return res.status(400).json({message: 'Please fill out all fields'});
   }

   var org = new Organization();

   org.name = req.body.name;
   org.email = req.body.email;
   org.desc = req.body.desc;
   org.city = req.body.city;
   org.country = req.body.country;
   org.type = "organization";

   //generate random temp password
   var randomPass = Math.random().toString(36).slice(-8);

   org.setPassword(randomPass);

   org.save(function(err){
      if(err){
          return next(err);
      }

      async.waterfall([
        function(done) {
          crypto.randomBytes(20, function(err, buf) {
              console.log("generate token");
            var token = buf.toString('hex');
            done(err, token);
          });
        },
        function(token, done) {
          Organization.findOne({ email: req.body.email }, function(err, org1) {
            if (!org) {
              //req.flash('error', 'No account with that email address exists.');
              return res.redirect('/registerorg');
            }
            console.log("organization found");
            org1.resetPasswordToken = token;
            org1.resetPasswordExpires = Date.now() + 3600000; // 1 hour

            org1.save(function(err) {
              console.log("organization saved");
              done(err, token, org1);
            });
          });
        },
        function(token, org2, done) {
          /*var smtpTransport = nodemailer.createTransport('SMTP', {
            service: 'Gmail',
            auth: {
              user: emailUser,
              pass: emailPass
            }
          });*/
          var smtpTransport = nodemailer.createTransport("smtps://pumpkin3500@gmail.com:"+emailPass+"@smtp.gmail.com");
          var mailOptions = {
            to: org2.email,
            from: 'pumpkin3500@gmail.com',
            subject: 'Node.js Password Reset',
            text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
              'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
              'http://' + req.headers.host + '/#/createpassword/' + token + '\n\n' +
              'If you did not request this, please ignore this email and your password will remain unchanged.\n'
          };
          smtpTransport.sendMail(mailOptions, function(err) {
            if(err){
                console.log("error sending mail: " + JSON.stringify(err));
            }
            //req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
            console.log("email sent using " + emailUser + " " + emailPass + " to " + org2.email);
            //console.log("Message info: " + JSON.stringify(info.response));
            done(err, 'done');
          });
        }
      ], function(err) {
        if (err){
            console.log("error: " + JSON.stringify(err));
        }
        console.log("done");
        return res.json({});
      });

      //return res.json({});
   });

});

router.get('/createpassword/:token', function(req, res){
  //res.render('./public/partials/setPass.html');
  res.send({});
});

router.post('/setPass/:token', function(req, res){
   //set the organization's password
   Organization.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, org) {
        if (!org) {
          console.log("Error: " + err);
          return err;
        }
        org.setPassword(req.body.password);
        org.resetPasswordToken = undefined;
        org.resetPasswordExpires = undefined;

        org.save(function(err) {
          if(err){
           return err;
          }
          return res.json({token: org.generateJWT()});
        });
     });
});

//preload user
router.param('user', function(req,res,next,id){
    var query = User.findById(id); //find the task

   // try to get the post details from the Tasks model and attach it to the request object
   query.exec(function(err, user){
      if(err){
          return next(err);
      }
      if(!user){
          return next(new Error('Can\'t find task'));
      }

      req.user = user;
      return next();
   });

});

//send notification to user
router.post('/notify/user/:user', auth, function(req,res,next){
    var msg = new Message();
    msg.message = req.body.message;
    msg.from_id = req.body.from;
    msg.to_id = req.params.user;

    msg.save(function(err, msg){
      if(err){
          return next(err);
      }

      res.json(msg);

   });

});

//send notification to user
router.post('/notify/org/:org', auth, function(req,res,next){
    var msg = new Message();
    msg.message = req.body.message;
    msg.from_id = req.body.from;
    msg.to_id = req.params.org;

    msg.save(function(err, msg){
      if(err){
          return next(err);
      }

      res.json(msg);

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
