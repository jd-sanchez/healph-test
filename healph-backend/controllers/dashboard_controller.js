const asyncHandler = require('express-async-handler');
const Daily_Intake =require('../models/daily_intake.js');
const User = require('../models/user.js');
const Meal = require('../models/meal.js');
const Report = require('../models/report.js');

function cleanFindString(reqQuery) {
    const removeFields = ["sort"];
    removeFields.forEach((val) => delete reqQuery[val]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in|match)\b/g,
    (match) => `$${match}`
    );

    return queryStr;
}

exports.getIntakes = asyncHandler(async (req, res, next) => {
    console.log(req.query);
    const reqQuery = req.query;
    const { sort } = req.query;
    
    let intakes;
    let queryStr = cleanFindString(reqQuery);

    if (sort == null){
        intakes = await Daily_Intake.paginate(JSON.parse(queryStr),
        {page: req.params.page, limit: req.params.limit});
    } else {      
        const sortString = sort.replace(",", " ");
        intakes = await Daily_Intake.paginate(JSON.parse(queryStr),{
            page: req.params.page, 
            limit: req.params.limit,
            collation: {locale: "en", strength: 2},
            sort: sortString });
    }
   
    res.send(intakes);
});


exports.getMeals = asyncHandler(async (req, res, next) => {
    console.log(req.query);
    const reqQuery = req.query;
    const { sort } = req.query;
    
    let meals;
    let queryStr = cleanFindString(reqQuery);

    if (sort == null){
        meals = await Meal.paginate(JSON.parse(queryStr),
        {page: req.params.page, limit: req.params.limit});
    } else {      
        const sortString = sort.replace(",", " ");
        meals = await Meal.paginate(JSON.parse(queryStr),{
            page: req.params.page, 
            limit: req.params.limit,
            collation: {locale: "en", strength: 2},
            sort: sortString });
    }
   
    res.send(meals);

});

exports.getReports = asyncHandler(async (req, res, next) => {
    console.log(req.query);
    const reqQuery = req.query;
    const { sort } = req.query;
    
    let reports;
    let queryStr = cleanFindString(reqQuery);

    if (sort == null){
        reports = await Report.paginate(JSON.parse(queryStr),
        {page: req.params.page, limit: req.params.limit});
    } else {      
        const sortString = sort.replace(",", " ");
        reports = await Report.paginate(JSON.parse(queryStr),{
            page: req.params.page, 
            limit: req.params.limit,
            collation: {locale: "en", strength: 2},
            sort: sortString });
    }
   
    res.send(reports);

});

exports.getUsers = asyncHandler(async (req, res, next) => {
    console.log(req.query);
    const reqQuery = req.query;
    const { sort } = req.query;
    
    let users;
    let queryStr = cleanFindString(reqQuery);

    if (sort == null){
        //users = await User.find(JSON.parse(queryStr));
        users = await User.paginate(JSON.parse(queryStr),
            {page: req.params.page, limit: req.params.limit});
    } else {      
        const sortString = sort.replace(",", " ");
        users = await User.paginate(JSON.parse(queryStr),{
            page: req.params.page, 
            limit: req.params.limit,
            collation: {locale: "en", strength: 2},
            sort: sortString });
    }
   
    res.send(users);
});

exports.getIntakeStatsDaily = asyncHandler(async (req, res, next) => {
    let dailydate = new Date();
    dailydate.setDate(dailydate.getDate()-1);

    const dailystats = await Daily_Intake.aggregate([
        {'$match': {date: dailydate.toISOString().slice(0,10)}},
        {'$group': {
            _id: null,
            'hale': {'$avg': '$hale'},
            'mealDiversity': {'$avg': '$mealDiversity'},
            'steps': {'$avg': '$steps'},
            'sleephrs': {'$avg': '$sleephrs'},
            'waterglass': {'$avg': '$waterglass'},
            'dailycal': {'$avg': '$dailycal'},
        }}
    ]);
    res.status(200).send(dailystats);
});

exports.getIntakeStatsWeekly = asyncHandler(async (req, res, next) => {
    let startdate = new Date();
    let lastdate = new Date();

    startdate.setDate(startdate.getDate() - 1);
    lastdate.setDate(lastdate.getDate() - 8);
    console.log(startdate, lastdate);
    const weeklystats = await Daily_Intake.aggregate([
        {'$match': {'date':{ $lte: startdate.toISOString().slice(0,10), $gte: lastdate.toISOString().slice(0,10)}}},
        {'$group': {
            _id: null,
            'hale': {'$avg': '$hale'},
            'mealDiversity': {'$avg': '$mealDiversity'},
            'steps': {'$avg': '$steps'},
            'sleephrs': {'$avg': '$sleephrs'},
            'waterglass': {'$avg': '$waterglass'},
            'dailycal': {'$avg': '$dailycal'},
        }}
    ]);
    res.status(200).send(weeklystats);
});

exports.getMealStatsDaily = asyncHandler(async (req, res, next) => {
    let startdate = new Date();
    let lastdate = new Date();
    startdate.setDate(startdate.getDate()-1);
    startdate.setHours(0,0,0,0);
    lastdate.setDate(lastdate.getDate()-2);
    lastdate.setHours(0,0,0,0);

    console.log(startdate.toISOString().slice(0,10), lastdate.toISOString().slice(0,10));
    const dailystats = await Meal.aggregate([

        {'$match': {'datetime': { $lt: startdate, $gte: lastdate}}},
        {'$group': {
            _id: null,
            'fat': {'$avg': '$fat'},
            'carbs': {'$avg': '$carbs'},
            'proteins': {'$avg': '$proteins'},
            'cal': {'$avg': '$cal'},
            'waste': {'$avg': '$waste'},
        }}
    ]);
    res.status(200).send(dailystats);
});

exports.getMealStatsWeekly = asyncHandler(async (req, res, next) => {
    let startdate = new Date();
    let lastdate = new Date();
    startdate.setDate(startdate.getDate()-1);
    startdate.setHours(0,0,0,0);
    lastdate.setDate(lastdate.getDate()-8);
    lastdate.setHours(0,0,0,0);

    console.log(startdate, lastdate);
    const weeklystats = await Meal.aggregate([
        {'$match': {'datetime':{ $lt: startdate, $gte: lastdate}}},
        {'$group': {
            _id: null,
            'fat': {'$avg': '$fat'},
            'carbs': {'$avg': '$carbs'},
            'proteins': {'$avg': '$proteins'},
            'cal': {'$avg': '$cal'},
            'waste': {'$avg': '$waste'},
        }}
    ]);
    res.status(200).send(weeklystats);
});

exports.dailyRankings = asyncHandler(async (req, res, next) => {
    const dailydate = new Date();
    dailydate.setDate(dailydate.getDate()-1);

    const rankings = await Daily_Intake.aggregate([//only accept intakes that were submitted
        {$match: {date: dailydate.toISOString().slice(0,10)}},
        {'$sort': {'hale': -1}}, 
        {'$lookup': {
            'from': 'users',
            'localField': 'uid',
            'foreignField': '_id',
            'as': 'user'
            }}, 
        {'$project': {
            'hale': 1, 
            'date': '$date',
            'user': '$user.name'
            }},
        {'$limit': 100}  
    ])
    
    res.status(200).send(rankings);
});

exports.weeklyRankings = asyncHandler(async (req, res, next) => {
    let startdate = new Date();
    let lastdate = new Date();
    
    startdate.setDate(startdate.getDate() - 1);
    lastdate.setDate(lastdate.getDate() - 8);
    console.log(startdate, lastdate);
    const rankings = await Daily_Intake.aggregate([ //only accept intakes that were submitted
        {'$match': {'date':{ $lte: startdate.toISOString().slice(0,10), $gte: lastdate.toISOString().slice(0,10)}}},
        {'$group': {
            '_id': '$uid', 
            'hale': {'$sum': '$hale'}, 
            'count': {'$sum': 1}
            }}, 
        {'$match': {'count': {'$gte': 5}}},
        {'$sort': {'hale': -1}}, 
        {'$lookup': {
            'from': 'users', 
            'localField': '_id', 
            'foreignField': '_id', 
            'as': 'user'
            }}, 
        {'$project': {
            'hale': 1, 
            'user': '$user.name'
            }},
            {'$limit': 100}        
    ])
        
    res.status(200).send(rankings);
});

//monthly rankings
exports.monthlyRankings = asyncHandler(async (req, res, next) => {
    let month_date = new Array();

    let dailydate = new Date();
    
    let month = 
        month_date.push(dailydate.toISOString().slice(0,7));
    
    const rankings = await Daily_Intake.aggregate([ //only accept intakes that were submitted
        {$match: {$expr: { $eq: [month, {$substrCP: [ "$date", 0, 7]} ]  } } },
        {'$group': {
            '_id': '$uid', 
            'hale': {'$sum': '$hale'}, 
            'count': {'$sum': 1}
            }}, 
        {'$match': {'count': {'$gte': 20}}},
        {'$sort': {'hale': -1}}, 
        {'$lookup': {
            'from': 'users', 
            'localField': '_id', 
            'foreignField': '_id', 
            'as': 'user'
            }}, 
        {'$project': {
            'hale': 1, 
            'user': '$user.name'
            }},
        {'$limit': 100}    
    ])
    res.status(200).send(rankings);
});