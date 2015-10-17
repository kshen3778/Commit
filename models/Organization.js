var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

var OrganizationSchema = new mongoose.Schema({
    name: String,
    description: String,
    city: String,
    country: String,
    email: {type: String, unique: true},
    hash: String,
    salt: String,
    tasks: [{type: mongoose.Schema.Types.ObjectId, ref: 'Task'}]
});

OrganizationSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

OrganizationSchema.methods.validPassword = function(password){
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
  return this.hash === hash;
};

OrganizationSchema.methods.generateJWT = function(){
  //set expiration to 60 days
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);
  
  return jwt.sign({
      _id: this._id,
      name: this.name,
      email: this.email,
      org: this, //store the entire org object in the jwt token
      exp: parseInt(exp.getTime() / 1000),
  }, 'SECRET');
};

mongoose.model('Organization', OrganizationSchema);