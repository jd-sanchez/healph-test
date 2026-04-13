const asyncHandler = require('express-async-handler');
const {User, EmpUser, Student} = require('../models/user.js');
const path = require("node:path");
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const maxAge = 28 * 24 * 60 * 60;
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'HealPHScrambler', {
      expiresIn: maxAge
    });
  };


exports.checkUnique = asyncHandler(async (req, res, next) => {
    const checkUname = await User.exists({uname: req.query.username});
    const checkEmail = await User.exists({email: req.query.email});
    let uniqueUname = true;
    let uniqueEmail = true;
    if (checkUname){
        uniqueUname = false;
    }
    if (checkEmail){
        uniqueEmail = false;
    }
    res.send({"unique-email": uniqueEmail, "unique-username": uniqueUname});
});

exports.signupEmployee = asyncHandler(async (req, res, next) => {
    const newEmp = new EmpUser({
        email: req.body.email,
        pass: req.body.password,
        uname: req.body.username,
        name: {
            fname: req.body.firstName,
            lname: req.body.lastName,
            mi: req.body.middleInitial,
            suffix: req.body.suffix
        },
        sex: req.body.sex,
        bday: req.body.birthday,
        loc:{
            region: req.body.region,
            town: req.body.town
        },   
        empnum: req.body.empnum,
        college: req.body.college,
        unit: req.body.unit,
        illnesses: req.body.illnesses,
        allergies: req.body.allergies,
        diet: req.body.diet,
        lifestyle: req.body.lifestyle, 
        weight: req.body.weight,
        height: req.body.height
    });

    try{
        console.log(newEmp);
        await newEmp.save();
        const token = createToken(newEmp._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(201).json({uid: newEmp._id});
    } catch(err) {
        console.log(err)
        if (err.code === 11000){
            res.status(400).json({ error: "Username/Email has already been used"});
        } else {
            res.status(400).json(err); 
        }  
    }
});

exports.signupStudent = asyncHandler(async (req, res, next) => {
    const newStudent = new Student({
        email: req.body.email,
        pass: req.body.password,
        uname: req.body.username,
        name: {
            fname: req.body.firstName,
            lname: req.body.lastName,
            mi: req.body.middleInitial,
            suffix: req.body.suffix
        },
        sex: req.body.sex,
        bday: req.body.birthday,
        loc:{
            region: req.body.region,
            town: req.body.town
        },   
        studentnum: req.body.studentnum,
        college: req.body.college,
        deg: req.body.degree,
        illnesses: req.body.illnesses,
        allergies: req.body.allergies,
        diet: req.body.diet,
        lifestyle: req.body.lifestyle, 
        weight: req.body.weight,
        height: req.body.height
    });

    try{
        console.log(newStudent);
        await newStudent.save();
        const token = createToken(newStudent._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(201).json({uid: newStudent._id});
    } catch(err) {
        console.log(err)
        if (err.code === 11000){
            res.status(400).json({ error: "Username/Email has already been used"});
        } else {
            res.status(400).json(err); 
        }  
    }
});

exports.login = asyncHandler(async (req, res, next) => {
    try {
        const user = await User.login(req.body.email, req.body.password);
        console.log(user);
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(200).json({ user: user._id });
    } catch (err) {
        res.status(401).json({ error: 'Invalid email or password.' });
    }
});

exports.logout = asyncHandler(async (req, res, next) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.send("User Logged out.");
});

exports.getUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.uid).exec();

    if (user === null) {
        return res.status(404).json({ error: 'User cannot be found.' });
    }

    if (user.__t == "EmpUser") {
        return res.status(200).json({
            username: user.uname,
            uname: user.uname,
            name: user.name,
            sex: user.sex,
            bday: user.bday,
            empnum: user.empnum,
            college: user.college,
            unit: user.unit,
            joindate: user.joindate,
            illnesses: user.illnesses,
            allergies: user.allergies,
            diet: user.diet,
            lifestyle: user.lifestyle,
            weight: user.weight,
            height: user.height,
        });
    } else if (user.__t == "StudentUser") {
        return res.status(200).json({
            username: user.uname,
            uname: user.uname,
            name: user.name,
            sex: user.sex,
            bday: user.bday,
            loc: user.loc,
            studentnum: user.studentnum,
            college: user.college,
            deg: user.deg,
            joindate: user.joindate,
            illnesses: user.illnesses,
            allergies: user.allergies,
            diet: user.diet,
            lifestyle: user.lifestyle,
            weight: user.weight,
            height: user.height,
        });
    }

    // Fallback for base User type (e.g. admin-created stubs)
    return res.status(200).json({
        username: user.uname,
        uname: user.uname,
        name: user.name,
        sex: user.sex,
        bday: user.bday,
    });
});

exports.getFullName = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.uid).exec();

    if (user === null) {
        res.status(404).send("User cannot be found");
    }
    
    const query = user.fullName;

    res.status(200).json({fullName: query});
});

exports.getProfilePicture = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.uid).exec();

    if (user === null) {
        res.status(404).send("User cannot be found");
    }
    const options = {
        root: path.join(__dirname, '../profpics')
    };
    console.log('/profpics/' + req.params.uid + ".jpg");
    res.status(200).sendFile( `${req.params.uid}` + ".jpg", options);
});

exports.getUserAge = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.uid).exec();

    if (user === null) {
        res.status(404).send("User cannot be found");
    }

    const query = user.age;

    res.status(200).json({age: query});
});

exports.updateMetrics = asyncHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(req.params.uid, {
        $set: {
          height: req.body.height,
          weight: req.body.weight
        }
      },);
    res.status(200).send("Success");
});

exports.updateBio = asyncHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(req.params.uid, {
        $set: {
            'name.fname': req.body.firstName,
            'name.lname': req.body.lastName,
            'name.mi': req.body.middleInitial,
            'name.suffix': req.body.suffix,
            sex: req.body.sex,
            'loc.region': req.body.region,
            'loc.town': req.body.town,
            college: req.body.college,
        }
    }, { new: true, runValidators: false });
    res.status(200).send("Success");
});

exports.uploadPicture = asyncHandler(async (req, res, next) => {
    res.status(200).send("Success");
});

// Completes the profile for a Google sign-in user who went through onboarding.
// Updates all fields that were left as placeholders during stub creation.
exports.completeProfile = asyncHandler(async (req, res, next) => {
    const { uid } = req.params;
    const {
        username, firstName, lastName, middleInitial, suffix,
        sex, birthday, region, town,
        userType,
        studentnum, college, degree,
        empnum, unit,
        illnesses, allergies, diet, lifestyle, weight, height,
    } = req.body;

    try {
        const updateFields = {
            uname: username,
            'name.fname': firstName,
            'name.lname': lastName,
            'name.mi': middleInitial ?? '',
            'name.suffix': suffix ?? '',
            sex,
            bday: birthday,
            'loc.region': region ?? '',
            'loc.town': town ?? '',
            college: college ?? '',
            illnesses: illnesses ?? [],
            allergies: allergies ?? [],
            diet: diet ?? '',
            lifestyle: lifestyle ?? '',
            weight: parseFloat(weight) || 0,
            height: parseFloat(height) || 0,
        };

        if (userType === 'student') {
            updateFields.studentnum = parseInt(studentnum) || 0;
            updateFields.deg = degree ?? '';
        } else {
            updateFields.empnum = parseInt(empnum) || 0;
            updateFields.unit = unit ?? '';
        }

        await User.findByIdAndUpdate(uid, { $set: updateFields }, { runValidators: false });
        res.status(200).json({ message: 'Profile completed.' });
    } catch (err) {
        console.error('completeProfile error:', err);
        if (err.code === 11000) {
            return res.status(400).json({ error: 'That username is already taken.' });
        }
        res.status(500).json({ error: 'Failed to update profile.' });
    }
});

exports.getGoals = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.uid)
        .select('calorieGoal stepsGoal waterGoal sleepGoal')
        .exec();
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.status(200).json({
        calorieGoal: user.calorieGoal ?? 2000,
        stepsGoal: user.stepsGoal ?? 10000,
        waterGoal: user.waterGoal ?? 8,
        sleepGoal: user.sleepGoal ?? 8,
    });
});

exports.updateGoals = asyncHandler(async (req, res, next) => {
    const { calorieGoal, stepsGoal, waterGoal, sleepGoal } = req.body;
    await User.findByIdAndUpdate(
        req.params.uid,
        { $set: { calorieGoal, stepsGoal, waterGoal, sleepGoal } },
        { runValidators: false }
    );
    res.status(200).json({ message: 'Goals updated.' });
});

exports.updatePassword = asyncHandler(async (req, res, next) => {

    await User.findByIdAndUpdate(req.params.uid, {password: req.body.password});
    res.status(200).send("Success");
});

exports.googleLogin = asyncHandler(async (req, res, next) => {
    const { idToken } = req.body;
    if (!idToken) {
        return res.status(400).json({ error: 'idToken is required.' });
    }

    // Verify the Google ID token
    let payload;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
    } catch (err) {
        console.error('Google token verification failed:', err.message);
        return res.status(401).json({ error: 'Invalid Google ID token.' });
    }

    const { sub: googleId, email, name, given_name, family_name } = payload;

    // Find existing user by googleId first, then fall back to email
    let user = await User.findOne({ googleId }).exec()
        ?? await User.findOne({ email }).exec();

    if (user) {
        // Link the googleId if this user signed up with email/password before
        if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }
    } else {
        // New Google user — create a stub StudentUser with neutral placeholders.
        // The user will fill in their real profile during the onboarding flow.
        const baseUname = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 16);
        const uname = baseUname + crypto.randomBytes(3).toString('hex');
        const placeholderPass = crypto.randomBytes(12).toString('base64').slice(0, 16);

        try {
            user = new Student({
                email,
                pass: placeholderPass,
                uname,
                name: { fname: 'Pending', lname: 'User' },
                sex: 'unset',
                bday: 'Jan 01 2000',
                googleId,
            });
            await user.save();
        } catch (err) {
            console.error('Failed to create Google user:', err);
            if (err.code === 11000) {
                return res.status(400).json({ error: 'An account with this email already exists.' });
            }
            return res.status(500).json({ error: 'Failed to create account.' });
        }

        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        return res.status(200).json({ user: user._id, isNewUser: true });
    }

    const token = createToken(user._id);
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(200).json({ user: user._id, isNewUser: false });
});