const asyncHandler = require('express-async-handler');
const Daily_Intake = require('../models/daily_intake.js');


// Helpers

function _metricField(metric) {
  const map = {
    steps: 'steps',
    waterglass: 'waterglass',
    sleephrs: 'sleephrs',
    mealDiversity: 'mealDiversity',
  };
  return map[metric] || 'hale';
}

/** Formats a Date object as YYYY-MM-DD. */
function _dateStr(d) {
  return d.toISOString().slice(0, 10);
}


 // Core weekly-style aggregation pipeline (group by uid, sum score, min-count gate).
 // Returns stages up to $sort — caller appends $lookup, $project, $limit.

function _groupPipeline(matchStage, field, minCount) {
  return [
    matchStage,
    { $group: { _id: '$uid', score: { $sum: `$${field}` }, count: { $sum: 1 } } },
    { $match: { count: { $gte: minCount } } },
    { $sort: { score: -1 } },
  ];
}

// Daily Rankings
// GET /rankings/daily?metric=hale|steps|waterglass|sleephrs|mealDiversity

exports.dailyRankings = asyncHandler(async (req, res) => {
  const field = _metricField(req.query.metric);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = _dateStr(yesterday);

  const dayBefore = new Date(yesterday);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const dayBeforeStr = _dateStr(dayBefore);

  const [current, previous] = await Promise.all([
    Daily_Intake.aggregate([
      { $match: { date: yesterdayStr } },
      { $sort: { [field]: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'uid',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $project: {
          uid: '$uid',
          score: `$${field}`,
          date: 1,
          user: '$user.name',
        },
      },
      { $limit: 100 },
    ]),
    Daily_Intake.aggregate([
      { $match: { date: dayBeforeStr } },
      { $sort: { [field]: -1 } },
      { $project: { uid: '$uid' } },
      { $limit: 100 },
    ]),
  ]);

  // Build uid → previousRank lookup
  const prevMap = new Map(previous.map((e, i) => [e.uid?.toString(), i + 1]));

  const result = current.map((e, i) => ({
    ...e,
    previousRank: prevMap.get(e.uid?.toString()) ?? null,
  }));

  res.status(200).json(result);
});


// Weekly Rankings
// GET /rankings/weekly?metric=hale|steps|waterglass|sleephrs|mealDiversity


exports.weeklyRankings = asyncHandler(async (req, res) => {
  const field = _metricField(req.query.metric);

  // Current window: yesterday back 7 days (mirrors original logic)
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() - 1);
  const start = new Date(now);
  start.setDate(start.getDate() - 8);

  // Previous window: one week before that
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - 7);

  const matchCurrent = { $match: { date: { $gte: _dateStr(start), $lte: _dateStr(end) } } };
  const matchPrev = { $match: { date: { $gte: _dateStr(prevStart), $lte: _dateStr(prevEnd) } } };

  const [current, previous] = await Promise.all([
    Daily_Intake.aggregate([
      ..._groupPipeline(matchCurrent, field, 5),
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $project: { score: 1, user: '$user.name' } },
      { $limit: 100 },
    ]),
    Daily_Intake.aggregate([
      ..._groupPipeline(matchPrev, field, 5),
      { $project: { _id: 1 } },
      { $limit: 100 },
    ]),
  ]);

  const prevMap = new Map(previous.map((e, i) => [e._id?.toString(), i + 1]));

  const result = current.map((e, i) => ({
    ...e,
    previousRank: prevMap.get(e._id?.toString()) ?? null,
  }));

  res.status(200).json(result);
});


// Monthly Rankings
// GET /rankings/monthly?metric=hale|steps|waterglass|sleephrs|mealDiversity


exports.monthlyRankings = asyncHandler(async (req, res) => {
  const field = _metricField(req.query.metric);

  const now = new Date();
  const month = now.toISOString().slice(0, 7);

  // Previous calendar month
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = prevDate.toISOString().slice(0, 7);

  const monthMatch = (m) => ({
    $match: { $expr: { $eq: [m, { $substrCP: ['$date', 0, 7] }] } },
  });

  const [current, previous] = await Promise.all([
    Daily_Intake.aggregate([
      ..._groupPipeline(monthMatch(month), field, 20),
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $project: { score: 1, user: '$user.name' } },
      { $limit: 100 },
    ]),
    Daily_Intake.aggregate([
      ..._groupPipeline(monthMatch(prevMonth), field, 20),
      { $project: { _id: 1 } },
      { $limit: 100 },
    ]),
  ]);

  const prevMap = new Map(previous.map((e, i) => [e._id?.toString(), i + 1]));

  const result = current.map((e, i) => ({
    ...e,
    previousRank: prevMap.get(e._id?.toString()) ?? null,
  }));

  res.status(200).json(result);
});


// Challenge Stats
// GET /rankings/challenge-stats
// Returns how many users completed the current rotating weekly challenge.


exports.challengeStats = asyncHandler(async (req, res) => {
  // Mirror the Flutter rotation: weekIndex = floor((dayOfYear-1) / 7) % 4
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now - startOfYear) / 86400000) + 1;
  const weekIndex = Math.floor((dayOfYear - 1) / 7) % 4;

  // Challenge definitions — must stay in sync with Flutter's _weeklyChallenges list
  const challenges = [
    { type: 'stepStreak',    field: 'steps',        threshold: 10000, daysRequired: 3 },
    { type: 'waterDays',     field: 'waterglass',   threshold: 8,     daysRequired: 5 },
    { type: 'sleepDays',     field: 'sleephrs',     threshold: 8,     daysRequired: 4 },
    { type: 'diversityDays', field: 'mealDiversity', threshold: 3.0,  daysRequired: 4 },
  ];

  const challenge = challenges[weekIndex];

  const monday = new Date(now);
  const dayOfWeek = monday.getDay();
  monday.setDate(monday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  const mondayStr = _dateStr(monday);
  const todayStr = _dateStr(now);

  // Count users who met the threshold for at least daysRequired days this week.
  const [qualifying, activeUids] = await Promise.all([
    Daily_Intake.aggregate([
      {
        $match: {
          date: { $gte: mondayStr, $lte: todayStr },
          [challenge.field]: { $gte: challenge.threshold },
        },
      },
      { $group: { _id: '$uid', days: { $sum: 1 } } },
      { $match: { days: { $gte: challenge.daysRequired } } },
      { $count: 'completedCount' },
    ]),
    Daily_Intake.distinct('uid', { date: { $gte: mondayStr, $lte: todayStr } }),
  ]);

  res.status(200).json({
    completedCount: qualifying[0]?.completedCount ?? 0,
    totalCount: activeUids.length,
    challengeIndex: weekIndex,
  });
});
