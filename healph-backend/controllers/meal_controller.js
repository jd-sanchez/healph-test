const asyncHandler = require('express-async-handler');
const Meal = require('../models/meal.js');

exports.newMeal = asyncHandler(async (req, res, next) => {
    const newMeal = new Meal({
        uid: req.body.uid,
        dailyid: req.body.dailyid,
        datetime: req.body.datetime,
        pic: req.body.pic ?? '',
        cal: req.body.cal,
        fat: req.body.fat,
        carbs: req.body.carbs,
        proteins: req.body.proteins,
        fibers: req.body.fibers,
        sugars: req.body.sugars,
        sodium: req.body.sodium,
        waste: req.body.waste,
        mealdesc: req.body.mealdesc,
        mealname: req.body.mealname,
        foodgroups: req.body.foodgroups,
    });

    await newMeal.save()
        .then(() => {
            res.status(201).json(newMeal);
        })
        .catch((error) => {
            res.status(400).json({ error: error.message });
        });
});

exports.getMeal = asyncHandler(async (req, res, next) => {
    const meal = await Meal.findById(req.params.oid)
        .select('datetime pic cal fat carbs proteins fibers sugars sodium waste mealdesc mealname foodgroups')
        .exec();

    if (meal === null) {
        return res.status(404).send("Meal cannot be found");
    }

    res.status(200).json(meal);
});

exports.getAllMeals = asyncHandler(async (req, res, next) => {
    const meals = await Meal.find({ uid: req.params.uid })
        .select('datetime pic cal fat carbs proteins fibers sugars sodium waste mealdesc mealname foodgroups')
        .exec();

    if (meals === null) {
        return res.status(404).send("Meals cannot be found");
    }

    res.status(200).json(meals);
});
