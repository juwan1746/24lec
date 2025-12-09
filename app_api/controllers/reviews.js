const mongoose = require('mongoose');
const Loc = mongoose.model('Location');
const User = mongoose.model('User'); // 👈 [중요] User 모델이 선언되어 있어야 합니다.

// 👇 이 함수를 추가하세요
const getAuthor = async (req, res, callback) => {
    // req.auth 또는 req.payload, req.user 중 존재하는 것을 사용
    const userProperty = req.auth || req.payload || req.user;

    if (userProperty && userProperty.email) {
        try {
            // 🌟 수정됨: .exec() 안에 콜백을 넣지 않고 await으로 결과를 받습니다.
            const user = await User.findOne({ email: userProperty.email }).exec();

            if (!user) {
                return res.status(404).json({ "message": "User not found" });
            }

            // 성공 시 콜백 실행 (user.name 전달)
            callback(req, res, user.name);

        } catch (err) {
            console.log(err);
            return res.status(404).json(err);
        }
    } else {
        return res.status(404).json({ "message": "User not found" });
    }
};
const reviewsCreate = (req, res) => { // 👈 매개변수에서 userName 제거! (req, res)만 남김
    getAuthor(req, res, async (req, res, userName) => { // 👈 콜백에서 진짜 userName을 받음
        const locationId = req.params.locationid;
        if (!locationId) {
            return res.status(404).json({ "message": "Location not found" });
        }

        try {
            const location = await Loc.findById(locationId).select('reviews');
            if (!location) {
                return res.status(404).json({ "message": "Location not found" });
            }
            // 진짜 userName을 전달
            await doAddReview(req, res, location, userName);
        } catch (err) {
            res.status(400).json(err);
        }
    });
};

// updateAverageRating 함수를 호출하거나, Mongoose의 save()를 Promise로 감싸서 사용합니다.
// 여기서는 async/await를 사용하여 Promise 기반으로 변환합니다.
const doAddReview = async (req, res, location, author) => {
    if (!location) {
        // 이 검사는 reviewsCreate에서 이미 했으므로 사실상 불필요하지만, 안전을 위해 남겨둡니다.
        return res
            .status(404)
            .json({ "message": "Location not found" });
    }

    try {
        const {rating, reviewText} = req.body;

        // 유효성 검사 추가 (필수)
        if (!rating || !reviewText) {
            return res.status(400).json({ "message": "Rating and reviewText are required" });
        }

        // 새 리뷰 추가
        location.reviews.push({
            author,
            rating,
            reviewText
        });

        // location.save()를 await으로 처리 (Promise 기반)
        const updatedLocation = await location.save();

        // 평균 평점 업데이트 (비동기 처리)
        // updateAverageRating이 Promise를 반환한다고 가정
        await updateAverageRating(updatedLocation._id);

        // 추가된 리뷰를 클라이언트에 반환
        // location.reviews.pop()은 배열을 변경하므로, slice(-1)[0]를 사용합니다.
        const thisReview = updatedLocation.reviews.slice(-1)[0];

        return res
            .status(201)
            .json(thisReview);

    } catch (err) {
        // 리뷰 저장 또는 다른 내부 오류 처리
        return res
            .status(400)
            .json(err);
    }
};

const updateAverageRating = async (locationId) => {
    try {
        const location = await Loc.findById(locationId).select('rating reviews');
        if (location) {
            await doSetAverageRating(location);
        }
    } catch (err) {
        console.log(err);
    }
};

const doSetAverageRating = async (location) => {
    if (location.reviews && location.reviews.length > 0) {
        const count = location.reviews.length;
        const total = location.reviews.reduce((acc, {rating}) => acc + rating, 0);
        location.rating = parseInt(total / count, 10);
        try {
            await location.save();
            console.log(`Average rating updated to ${location.rating}`);
        } catch (err) {
            console.log(err);
        }
    }
};




const reviewsReadOne = async (req, res) => {
    try {
        const location = await Loc.findById(req.params.locationid).select('name reviews').exec();
        if (!location) {
            return res
                .status(404)
                .json({ "message": "location not found" });
        }
        if (location.reviews && location.reviews.length > 0) {
            const review = location.reviews.id(req.params.reviewid);
            if (!review) {
                return res
                    .status(404)
                    .json({ "message": "review not found" });
            }
            const response = {
                location: {
                    name: location.name,
                    id: req.params.locationid
                },
                review
            };
            return res
                .status(200)
                .json(response);
        } else {
            return res
                .status(404)
                .json({ "message": "No reviews found" });
        }
    } catch (err) {
        return res
            .status(400)
            .json(err);
    }
};

const reviewsUpdateOne = async (req, res) => {
    if (!req.params.locationid || !req.params.reviewid) {
        return res.status(404).json({ "message": "Not found, locationid and reviewid are both required" });
    }

    try {
        const location = await Loc.findById(req.params.locationid).select('reviews').exec();
        if (!location) {
            return res.status(404).json({ "message": "Location not found" });
        }

        if (location.reviews && location.reviews.length > 0) {
            const thisReview = location.reviews.id(req.params.reviewid);
            if (!thisReview) {
                return res.status(404).json({ "message": "Review not found" });
            }

            thisReview.author = req.body.author;
            thisReview.rating = req.body.rating;
            thisReview.reviewText = req.body.reviewText;

            const updatedLocation = await location.save();
            await updateAverageRating(updatedLocation._id);
            return res.status(200).json(thisReview);
        } else {
            return res.status(404).json({ "message": "No review to update" });
        }
    } catch (err) {
        return res.status(400).json(err);
    }
};
const reviewsDeleteOne = async (req, res) => {
    const { locationid, reviewid } = req.params;
    if (!locationid || !reviewid) {
        return res.status(404).json({ 'message': 'Not found, locationid and reviewid are both required' });
    }

    try {
        const location = await Loc.findById(locationid).select('reviews').exec();
        if (!location) {
            return res.status(404).json({ 'message': 'Location not found' });
        }

        if (location.reviews && location.reviews.length > 0) {
            const review = location.reviews.id(reviewid);
            if (!review) {
                return res.status(404).json({ 'message': 'Review not found' });
            }

            review.remove();
            await location.save();
            await updateAverageRating(location._id);
            return res.status(204).json(null);
        } else {
            return res.status(404).json({ 'message': 'No Review to delete' });
        }
    } catch (err) {
        return res.status(400).json(err);
    }
};

module.exports = {
    reviewsCreate,
    reviewsReadOne,
    reviewsUpdateOne,
    reviewsDeleteOne
};