var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var timeout = require('connect-timeout'); //express v4

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var videosRouter = require('./routes/videos');
const { paths } = require('./configs/consts');

var app = express();
app.use(timeout(1200000));
app.use(haltOnTimedout);

function haltOnTimedout(req, res, next){
  if (!req.timedout) next();
}

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(paths.frontend));
app.use(cors());

app.use('/', indexRouter);
//app.use('/users', usersRouter);
app.use('/api', videosRouter);

app.get('/*', (req, res) => {
  console.log('Here we come');
  res.sendFile('index.html');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
 // res.status(err.status || 500);
  //res.render('error');
  res.sendFile(path.join(paths.frontend, 'index.html'));
});

module.exports = app;
