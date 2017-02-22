var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var uuid = require('uuid');

var middleware = {
    api: require('./middleware/api'),
    response: require('./middleware/response'),
    prototype: require('./middleware/prototype'),
    authenticate: require('./middleware/authenticate')
}

var routes = {
    admin: require('./routes/admin'),
    test:  require('./routes/test'),
    user: require('./routes/user')
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'plain');

app.set('trust proxy', 1);
var sessionOptions = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'kmall_session'
};
var sessionStore = new MySQLStore(sessionOptions);
app.use(session({
  genid: function(req) {
    return uuid.v1(); // use UUIDs for session IDs
  },
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  store: sessionStore,
  cookie: { 
    // http协议设为true会出现每次请求都生成不同sessionID的问题
    secure: false,
    maxAge: 1800000,//session有效期为半小时
    httpOnly: false 
  }
}));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(middleware.prototype);
//自定义的中间件
app.use(middleware.api);
app.use(middleware.response);
app.use('/admin', middleware.authenticate);//用户认证
//自定义的路由
app.use('/', routes.admin, routes.test, routes.user);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  console.log(err);
  res.send('error');
});

module.exports = app;