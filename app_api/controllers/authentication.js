const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');

// register는 async/await로 잘 구현되어 있지만, 오류 상태 코드를 수정합니다.
const register = async (req, res) => {
    if (!req.body.name || !req.body.email || !req.body.password) {
        return res
            .status(400)
            .json({ "message": "All fields required" });
    }

    const user = new User();
    user.name = req.body.name;
    user.email = req.body.email;
    user.setPassword(req.body.password);

    try {
        await user.save();

        const token = user.generateJwt();
        res
            .status(200)
            .json({ token });

    } catch (err) {
        // DB 저장 오류는 409 또는 500이 더 적절합니다.
        res
            .status(409) // 409 Conflict (예: 중복 이메일)
            .json(err);
    }
};

// login 함수를 Passport 콜백 스타일로 복원 (Promise 헬퍼 불필요)
const login = (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ "message": "All fields required" });
    }

    passport.authenticate('local', (err, user, info) => {
        // 1. 에러가 있는지 콘솔에 찍어봅니다.
        if (err) {
            console.error("Passport Error:", err); // 서버 터미널(로그) 확인 필수
            return res.status(500).json(err); // 404가 아니라 500으로 변경
        }

        // 2. 유저가 없는 경우(로그인 실패)
        if (!user) {
            console.log("Login Failed:", info);
            return res.status(401).json(info);
        }

        // 3. 성공
        const token = user.generateJwt();
        res.status(200).json({ token });

    })(req, res);
};

module.exports = {
    register,
    login
};