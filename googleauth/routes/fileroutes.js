const router = require('express').Router();

router.get('/', authCheck, (req, res) => {
    res.render('profile', { user: req.user });
});

module.exports = router;