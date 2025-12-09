const express = require('express');
const router = express.Router();
const ctrlLocations = require('../controllers/locations');
const ctrlReviews = require('../controllers/reviews');
const ctrlAuth = require('../controllers/authentication');
const {expressjwt: jwt} = require('express-jwt');
const auth = jwt({
    secret: process.env.JWT_SECRET,
    algorithms: ['HS256'], // default algorithm
    // userProperty: 'payload'
    userProperty: 'req.auth'
});
// locations
router
    .route('/locations')
    .get(ctrlLocations.locationsListByDistance)
    .post(ctrlLocations.locationsCreate);

router
    .route('/locations/:locationid')
    .get(ctrlLocations.locationsReadOne)
    .put(ctrlLocations.locationsUpdateOne)
    .delete(ctrlLocations.locationsDeleteOne);

// reviews
router
    .route('/locations/:locationid/reviews')
    .post(auth, ctrlReviews.reviewsCreate);

router
    .route('/locations/:locationid/reviews/:reviewid')
    .get(ctrlReviews.reviewsReadOne)
    .put(auth, ctrlReviews.reviewsUpdateOne)
    .delete(auth, ctrlReviews.reviewsDeleteOne);
 // 인증 컨트롤러가 임포트되어 있다고 가정
// ...
router.post('/register', ctrlAuth.register); // 이 코드가 apiRouter에 포함되어 있어야 합니다.

router.post('/login', ctrlAuth.login);

module.exports = router;
