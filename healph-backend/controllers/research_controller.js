const asyncHandler = require('express-async-handler');
const Intake = require('../models/daily_intake.js');
const Meal = require('../models/meal.js');

// Build a date filter from optional ?from= and ?to= query params (YYYY-MM-DD)
function dateFilter(query) {
    const filter = {};
    if (query.from || query.to) {
        filter.date = {};
        if (query.from) filter.date.$gte = query.from;
        if (query.to)   filter.date.$lte = query.to;
    }
    return filter;
}

// GET /research/health-trends
// Daily averages: steps, sleep, water, calories, meal diversity, HALE score
// Optional: ?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.healthTrends = asyncHandler(async (req, res) => {
    const match = dateFilter(req.query);

    const results = await Intake.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$date',
                avgSteps:         { $avg: '$steps' },
                avgSleepHours:    { $avg: '$sleephrs' },
                avgWaterGlasses:  { $avg: '$waterglass' },
                avgCalories:      { $avg: '$dailycal' },
                avgMealDiversity: { $avg: '$mealDiversity' },
                avgHale:          { $avg: '$hale' },
                recordCount:      { $sum: 1 },
            }
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                _id: 0,
                date:             '$_id',
                avgSteps:         { $round: ['$avgSteps', 0] },
                avgSleepHours:    { $round: ['$avgSleepHours', 2] },
                avgWaterGlasses:  { $round: ['$avgWaterGlasses', 2] },
                avgCalories:      { $round: ['$avgCalories', 0] },
                avgMealDiversity: { $round: ['$avgMealDiversity', 2] },
                avgHale:          { $round: ['$avgHale', 2] },
                recordCount:      1,
            }
        }
    ]);

    res.status(200).json(results);
});

// GET /research/nutrition-trends
// Daily averages for macronutrients: proteins, carbs, fats, fibers, sugars
// Optional: ?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.nutritionTrends = asyncHandler(async (req, res) => {
    const match = dateFilter(req.query);

    const results = await Intake.aggregate([
        { $match: match },
        {
            $group: {
                _id:          '$date',
                avgProteins:  { $avg: '$proteins' },
                avgCarbs:     { $avg: '$carbs' },
                avgFats:      { $avg: '$fats' },
                avgFibers:    { $avg: '$fibers' },
                avgSugars:    { $avg: '$sugars' },
                recordCount:  { $sum: 1 },
            }
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                _id: 0,
                date:         '$_id',
                avgProteins:  { $round: ['$avgProteins', 2] },
                avgCarbs:     { $round: ['$avgCarbs', 2] },
                avgFats:      { $round: ['$avgFats', 2] },
                avgFibers:    { $round: ['$avgFibers', 2] },
                avgSugars:    { $round: ['$avgSugars', 2] },
                recordCount:  1,
            }
        }
    ]);

    res.status(200).json(results);
});

// GET /research/food-patterns
// Most frequently logged food groups and average meal diversity
// Optional: ?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=20
exports.foodPatterns = asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    // Build date filter on the meal datetime field
    const matchStage = {};
    if (req.query.from || req.query.to) {
        matchStage.datetime = {};
        if (req.query.from) matchStage.datetime.$gte = new Date(req.query.from);
        if (req.query.to)   matchStage.datetime.$lte = new Date(req.query.to + 'T23:59:59Z');
    }

    const [foodGroups, diversityStats] = await Promise.all([
        // Top food groups by log frequency
        Meal.aggregate([
            { $match: matchStage },
            { $unwind: '$foodgroups' },
            {
                $group: {
                    _id:   '$foodgroups',
                    count: { $sum: 1 },
                }
            },
            { $sort: { count: -1 } },
            { $limit: limit },
            { $project: { _id: 0, foodGroup: '$_id', count: 1 } }
        ]),

        // Average meal diversity from daily intakes
        Intake.aggregate([
            { $match: dateFilter(req.query) },
            {
                $group: {
                    _id:              null,
                    avgMealDiversity: { $avg: '$mealDiversity' },
                    totalRecords:     { $sum: 1 },
                }
            },
            {
                $project: {
                    _id: 0,
                    avgMealDiversity: { $round: ['$avgMealDiversity', 2] },
                    totalRecords: 1,
                }
            }
        ])
    ]);

    res.status(200).json({
        topFoodGroups:    foodGroups,
        diversitySummary: diversityStats[0] || { avgMealDiversity: null, totalRecords: 0 },
    });
});

// GET /research/population-stats
// Overall population-level stats: active user count, all-time averages, HALE distribution
exports.populationStats = asyncHandler(async (req, res) => {
    const [overallStats, haleDistribution, dailyActivity] = await Promise.all([
        // Overall averages across all records
        Intake.aggregate([
            {
                $group: {
                    _id:                  null,
                    totalRecords:         { $sum: 1 },
                    uniqueUsers:          { $addToSet: '$uid' },
                    avgSteps:             { $avg: '$steps' },
                    avgSleepHours:        { $avg: '$sleephrs' },
                    avgWaterGlasses:      { $avg: '$waterglass' },
                    avgCalories:          { $avg: '$dailycal' },
                    avgMealDiversity:     { $avg: '$mealDiversity' },
                    avgHale:              { $avg: '$hale' },
                }
            },
            {
                $project: {
                    _id:              0,
                    totalRecords:     1,
                    totalActiveUsers: { $size: '$uniqueUsers' },
                    avgSteps:         { $round: ['$avgSteps', 0] },
                    avgSleepHours:    { $round: ['$avgSleepHours', 2] },
                    avgWaterGlasses:  { $round: ['$avgWaterGlasses', 2] },
                    avgCalories:      { $round: ['$avgCalories', 0] },
                    avgMealDiversity: { $round: ['$avgMealDiversity', 2] },
                    avgHale:          { $round: ['$avgHale', 2] },
                }
            }
        ]),

        // HALE score distribution in buckets of 10 (0-9, 10-19, ... 90-100)
        Intake.aggregate([
            {
                $bucket: {
                    groupBy:    '$hale',
                    boundaries: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 101],
                    default:    'other',
                    output: { count: { $sum: 1 } }
                }
            },
            {
                $project: {
                    _id: 0,
                    haleRange: {
                        $concat: [
                            { $toString: '$_id' },
                            '–',
                            { $toString: { $subtract: [{ $add: ['$_id', 10] }, 1] } }
                        ]
                    },
                    count: 1,
                }
            }
        ]),

        // Average number of active logging days per user
        Intake.aggregate([
            {
                $group: {
                    _id:      '$uid',
                    logDays:  { $sum: 1 },
                }
            },
            {
                $group: {
                    _id:            null,
                    avgLogDays:     { $avg: '$logDays' },
                    medianLogDays:  { $push: '$logDays' },
                }
            },
            {
                $project: {
                    _id: 0,
                    avgLogDaysPerUser: { $round: ['$avgLogDays', 1] },
                }
            }
        ])
    ]);

    res.status(200).json({
        overview:         overallStats[0] || {},
        haleDistribution: haleDistribution,
        activitySummary:  dailyActivity[0] || {},
    });
});
