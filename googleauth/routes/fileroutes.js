const router = require('express').Router();

router.get('/', authCheck, (req, res) => {
    res.render('profile');
});

module.exports = router;