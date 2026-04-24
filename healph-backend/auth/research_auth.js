const RESEARCH_API_KEY = process.env.RESEARCH_API_KEY;

module.exports = (req, res, next) => {
    if (!RESEARCH_API_KEY) {
        return res.status(503).json({ error: 'Research API is not configured on this server.' });
    }
    const key = req.headers['x-research-key'];
    if (!key || key !== RESEARCH_API_KEY) {
        return res.status(401).json({ error: 'Invalid or missing research API key.' });
    }
    next();
};
