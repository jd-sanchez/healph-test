const asyncHandler = require('express-async-handler');
const Event = require('../models/event.js');

exports.getAllEvents = asyncHandler(async (req, res) => {
    const events = await Event.find().sort({ createdAt: 1 }).exec();
    res.status(200).json(events);
});

exports.createEvent = asyncHandler(async (req, res) => {
    const { title, description, date, time, location, imageUrl } = req.body;
    const event = new Event({ title, description, date, time, location, imageUrl });
    await event.save();
    res.status(201).json(event);
});

exports.updateEvent = asyncHandler(async (req, res) => {
    const event = await Event.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: false }
    );
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    res.status(200).json(event);
});

exports.deleteEvent = asyncHandler(async (req, res) => {
    await Event.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Event deleted.' });
});

exports.joinEvent = asyncHandler(async (req, res) => {
    const { username } = req.body;
    const event = await Event.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { participants: username } },
        { new: true }
    );
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    res.status(200).json(event);
});

exports.leaveEvent = asyncHandler(async (req, res) => {
    const { username } = req.body;
    const event = await Event.findByIdAndUpdate(
        req.params.id,
        { $pull: { participants: username } },
        { new: true }
    );
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    res.status(200).json(event);
});
