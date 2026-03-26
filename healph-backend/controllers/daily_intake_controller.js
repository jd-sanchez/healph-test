const asyncHandler = require('express-async-handler');
const Intake = require('../models/daily_intake.js');
const Meal = require('../models/meal.js');
require('mongoose').Promise = global.Promise;
const mongoose = require('mongoose');

// Create a new daily intake, or update if one already exists for that uid + date
exports.newDailyIntake = asyncHandler(async (req, res, next) => {
    const existing = await Intake.findOneAndUpdate(
        { uid: req.params.uid, date: req.body.date },
        {
            $set: {
                sleephrs: req.body.hoursOfSleep,
                waterglass: req.body.glassesOfWater,
                dailycal: req.body.dailyCalories,
                steps: req.body.stepsTaken,
                hale: req.body.hale,
                mealDiversity: req.body.mealDiversity,
                proteins: req.body.proteins,
                carbs: req.body.carbs,
                fats: req.body.fats,
                fibers: req.body.fibers,
                sugars: req.body.sugars,
            }
        },
        { new: true }
    );

    if (existing) {
        return res.status(200).json(existing);
    }

    const newIntake = new Intake({
        uid: req.params.uid,
        date: req.body.date,
        sleephrs: req.body.hoursOfSleep,
        waterglass: req.body.glassesOfWater,
        dailycal: req.body.dailyCalories,
        steps: req.body.stepsTaken,
        hale: req.body.hale,
        mealDiversity: req.body.mealDiversity,
        proteins: req.body.proteins,
        carbs: req.body.carbs,
        fats: req.body.fats,
        fibers: req.body.fibers,
        sugars: req.body.sugars,
    });

    await newIntake.save()
        .then(() => {
            res.status(201).json(newIntake);
        })
        .catch((err) => {
            res.status(400).json({ error: err.message });
        });
});

exports.viewDailyIntake = asyncHandler(async (req, res, next) => {
    const intake = await Intake.findOne({ uid: req.params.uid, date: req.params.date })
        .select('date sleephrs waterglass dailycal steps hale mealDiversity proteins carbs fats fibers sugars')
        .exec();

    if (intake === null) {
        return res.status(404).send("Intake was not found");
    }

    const intakeMeals = await Meal.find({ dailyid: intake._id }).exec();

    res.status(200).json({ intake: intake, meals: intakeMeals });
});

exports.getHALE = asyncHandler(async (req, res, next) => {
    const intake = await Intake.findOne({ uid: req.params.uid, date: req.params.date }).exec();

    if (intake === null) {
        return res.status(404).send("Intake was not found");
    }

    res.status(200).json({ hale: intake.hale });
});

exports.getAllIntakes = asyncHandler(async (req, res, next) => {
    const intakes = await Intake.find({ uid: req.params.uid })
        .select('date sleephrs waterglass dailycal steps hale mealDiversity proteins carbs fats fibers sugars')
        .exec();

    if (intakes === null) {
        return res.status(404).send("Intakes were not found");
    }

    res.status(200).json(intakes);
});
