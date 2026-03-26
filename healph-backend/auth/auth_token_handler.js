const jwt = require('jsonwebtoken');
const {User} = require('../models/user.js');
const Admin = require('../models/admin.js');


exports.adminAuth  = (req, res, next) => {
    const token = req.cookies.jwt;

      if (token) {
        jwt.verify(token, 'HealPHAdminScrambler', async (err, decodedToken) => {
          if (err) {
            console.log(err.message);
            return res.status(401).json({ error: 'Insufficient permissions. Please log in.' });
          } else {
            console.log(decodedToken);
            let admin = await Admin.findById(decodedToken.id);
            if (!admin) {
              return res.status(401).json({ error: 'Insufficient permissions. Please log in.' });
            }
            next();
          }
        });
      } else {
        return res.status(401).json({ error: 'Insufficient permissions. Please log in.' });
      }
    };

exports.userAuth = (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, 'HealPHScrambler', async (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        return res.status(401).json({ error: 'Insufficient permissions. Please log in.' });
      } else {
        console.log(decodedToken);
        let user = await User.findById(decodedToken.id);
        if (!user) {
          return res.status(401).json({ error: 'Insufficient permissions. Please log in.' });
        }
        next();
      }
    });
  } else {
    return res.status(401).json({ error: 'Insufficient permissions. Please log in.' });
  }
}
