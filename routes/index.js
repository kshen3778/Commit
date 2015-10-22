var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');
var User = mongoose.model('User');
var Organization = mongoose.model('Organization');
//var Location = mongoose.model('Location');

var router = express.Router();

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//user's dashboard
router.get('/dashboard', auth, function(req,res,next){
    /*User.findOne({email: req.payload.user.email}, function(err, user){
        
        if(err){return err;}

        user.populate('locations', function(err, locations){
            if(err){
                return next(err);
            }
            res.json(locations.locations);
        });
    });*/
    if(req.payload.type === "user"){
        User.findOne({email: req.payload.user.email}, function(err, user){
        
            if(err){return err;}
    
            user.populate('tasks', function(err, tasks){
                if(err){
                    return next(err);
                }
                res.json(tasks);
            });
        });
    }
    
    else if(req.payload.type === "organization"){
        Organization.findOne({email: req.payload.org.email}, function(err, org){
        
            if(err){return err;}
    
            org.populate('tasks', function(err, tasks){
                if(err){
                    return next(err);
                }
                res.json(tasks);
            });
        });
    }
});

router.get('/orgdashboard', auth, function(req,res,next){
    
});

//user registration
router.post('/register', function(req, res, next){
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
       console.log("registration");
       console.log(user);
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
       return res.status(400).json({message: 'Please fill out al required fields'});
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
