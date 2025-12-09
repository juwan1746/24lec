require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors'); // 모듈 불러오기

// ... (다른 설정들)

// <--- 이 한 줄만 추가하면 브라우저 차단이 풀립니다.

// Passport는 DB 모델 이전에 require되어야 합니다.
const passport = require('passport');
require('./app_api/models/db');
// Strategy는 User 모델이 존재해야 하므로 DB 모델 이후에 configure되어야 합니다.
require('./app_api/config/passport');
// require('./app_server/models/db');


const indexRouter = require('./app_server/routes/index');
const usersRouter = require('./app_server/routes/users');
const apiRouter = require('./app_api/routes/index');

var app = express();

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // For legacy browser support
};
app.use(cors(corsOptions));

app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-with, Content-type, Accept, Authorization');
  next();
});
// view engine setup

// [수정 전] - 이렇게 하면 아래 줄이 윗 줄을 덮어써 버립니다.
// app.set('views', path.join(__dirname, 'views'));
// app.set('views', path.join(__dirname, 'app_server', 'views'));

// [수정 후] - 배열([])을 사용하여 두 경로를 모두 등록합니다.
app.set('views', [
  path.join(__dirname, 'views'),
  path.join(__dirname, 'app_server', 'views')
]);
app.set('view engine', 'pug');
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 1. 정적 파일 및 빌드 폴더 설정
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'app_public', 'build'))); // React 빌드 파일 서비스

// Passport는 정적 라우트 이후, 인증을 사용할 라우트(API) 이전에 초기화되어야 합니다.
app.use(passport.initialize());

// --- 라우팅 설정 ---
// API 라우터 설정
app.use('/api', apiRouter);

// 서버(SSR/Express 뷰 템플릿) 라우터 설정 (이전 로그의 404 오류를 해결하기 위해 추가)
app.use('/', indexRouter);
app.use('/users', usersRouter); // 필요한 경우 추가

// --- 오류 핸들러 ---

// JWT 인증 거부 오류 처리 (UnauthorizedError)
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res
        .status(401)
        .json({"message": err.name + ": " + err.message});
  }
  // UnauthorizedError가 아닌 경우 다음 오류 핸들러로 전달
  next(err);
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler (기존 Express 기본 오류 핸들러)
app.use(function(err, req, res, next) {
  console.error("🔥🔥 에러 발생 확인: ", err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  // 이전 로그에서 발생한 "Failed to lookup view 'error'" 오류를 해결하기 위해,
  // API 요청이었을 경우 JSON 응답을 보내도록 처리 로직 추가 가능
  if (req.originalUrl.startsWith('/api/')) {
    res.json({
      message: err.message,
      error: res.locals.error
    });
  } else {
    // API 요청이 아니면 뷰 템플릿 렌더링
    res.render('error');
  }
});

module.exports = app;
