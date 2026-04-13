const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');
const bcrypt = require("bcrypt");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: { type: String, required: true,
      maxLength: 50, unique: [true, 'email is already taken'] },
  pass: { type: String, required: true, minLength: 8, maxLength: 24 },
  uname: { type: String, required: true, minLength: 4, 
      maxLength: 24, unique: [true, 'username is already taken'] },
  name: {
    fname: { type: String, required: true },
    lname: { type: String, required: true },
    mi: { type: String, default: '' },
    suffix: { type: String, default: '' }
  },
  sex: {type: String, required: true},
  bday: { type: String, required: true, minLength: 9 ,maxLength: 11 },
  loc: { region: String, town: String },
  college: { type: String },
  joindate: { type: Date, default: Date.now },
  illnesses: { type: [String] },
  allergies: { type: [String] },
  diet: { type: String },
  lifestyle: { type: String },
  weight: { type: Number, min: 0 },
  height: { type: Number, min: 0 },
  googleId: { type: String, sparse: true },
  calorieGoal: { type: Number, default: 2000 },
  stepsGoal: { type: Number, default: 10000 },
  waterGoal: { type: Number, default: 8 },
  sleepGoal: { type: Number, default: 8 },
});

userSchema.virtual('fullName').get(function () {
    return this.name.fname + ' ' + this.name.lname + ' ' + this.name.suffix;
});

userSchema.virtual("url").get(function () {
    return "/users/" + this.uname;
});

userSchema.virtual('age').get(function() {
    var today = new Date();
    var birthdate = new Date(this.bday); 
    var age = today.getFullYear() - birthdate.getFullYear();
    var m = today.getMonth() - birthdate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
        age--;
    }
    return age;
});

//password encryption code taken from mongodb blog by @jmar777

userSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  this.pass = await bcrypt.hash(this.pass, salt);
  next();
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.pass, function(err, isMatch) {
      if (err) return cb(err);
      cb(null, isMatch);
  });
}

userSchema.statics.login = async function(email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.pass);
    if (auth) {
      return user;
    }
    throw Error('incorrect password');
  }
  throw Error('incorrect email');
}

userSchema.plugin(mongoosePaginate);

const User = mongoose.model('User', userSchema);

const EmpUser = User.discriminator('EmpUser', 
  new mongoose.Schema({ 
    empnum: { type: Number },
    unit: { type: String }
  })
);

const Student = User.discriminator('StudentUser', 
  new mongoose.Schema({ 
    studentnum: { type: Number },
    deg: { type: String }
  })
);

module.exports = {User, EmpUser, Student};