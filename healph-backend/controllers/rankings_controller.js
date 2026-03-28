const asyncHandler = require('express-async-handler');
const Daily_Intake =require('../models/daily_intake.js');
const Meal = require('../models/meal.js');

exports.dailyRankings = asyncHandler(async (req, res, next) => {
    const dailydate = new Date();
    dailydate.setDate(dailydate.getDate()-1);
    const dailydateStr = dailydate.toISOString().slice(0,10);

    const rankings = await Daily_Intake.aggregate([//only accept intakes that were submitted
        {'$match': {date: dailydateStr}},
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
    const month = new Date().toISOString().slice(0,7);

    const rankings = await Daily_Intake.aggregate([ //only accept intakes that were submitted
        {'$match': {$expr: { $eq: [month, {$substrCP: [ "$date", 0, 7]} ]  } } },
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