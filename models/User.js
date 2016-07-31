var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

var UserSchema = new mongoose.Schema({
    email: {type: String, unique: true},
    hash: String,
    salt: String,
    tasks: [{type: mongoose.Schema.Types.ObjectId, ref: 'Task'}],
    taskrequests: [{type: mongoose.Schema.Types.ObjectId, ref: 'TaskRequest'}],
    type: String,
    phone: String,
    school: String,
    name: String
});

UserSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

UserSchema.methods.validPassword = function(password){
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
  return this.hash === hash;
};

UserSchema.methods.generateJWT = function(){
  //set expiration to 60 days
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign({
      _id: this._id,
      email: this.email,
      type: this.type,
      user: this, //store the entire user object in the jwt token
      exp: parseInt(exp.getTime() / 1000),
  }, 'SECRET');
};

UserSchema.methods.edit = function(edits, cb){
  this.name = edits.name;
  this.email = edits.email;
  this.phone = edits.phone;
  this.school = edits.school;

  this.save(cb);
};

mongoose.model('User', UserSchema);
