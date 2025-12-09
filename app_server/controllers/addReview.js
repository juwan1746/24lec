const addReview = function(req, res){
    res.render('location-review-form', {
        title: 'Review Starcups on Loc8r',
        pageHeader: { title: 'Review Starcups' }
    });
};
