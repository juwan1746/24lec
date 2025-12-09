const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const User = mongoose.model('User');

passport.use(new LocalStrategy({
        usernameField: 'email', // postman에서 email로 보냈으므로 필수 설정
    },
    // 1. 여기를 async 함수로 변경
    async (username, password, done) => {
        try {
            // 2. 콜백을 지우고 await로 변경
            const user = await User.findOne({ email: username });

            // 유저가 없는 경우
            if (!user) {
                return done(null, false, {
                    message: 'Incorrect username!'
                });
            }

            // 비밀번호가 틀린 경우
            if (!user.validPassword(password)) {
                return done(null, false, {
                    message: 'Incorrect password!'
                });
            }

            // 성공
            return done(null, user);

        } catch (err) {
            // DB 에러 발생 시
            return done(err);
        }
    }
));