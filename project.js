var express = require('express');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var bodyParser = require('body-parser');
var passport = require('passport');
var fs = require('fs');
var LocalStrategy = require('passport-local').Strategy;
var mysql = require('mysql');
var conn = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '111111',
  database : 'project'
});
conn.connect();
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'asdf',
  resave: false,
  saveUninitialized: true,
  store:new MySQLStore({
    host:'localhost',
    port:3306,
    user:'root',
    password:'111111',
    database:'project'
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/', express.static(__dirname + "/"));
var nocache = require('nocache');
app.use(nocache());

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/auth/logout', function(req, res){
  req.logout();
  res.redirect('/auth/login');
});

app.get('/welcome', function(req, res){
    fs.readFile('views/index.html', function(error, data){
        res.writeHead(200, {
            'Content-Type':'text/html',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
'Pragma': 'no-cache',
'Expires': 0,
'Surrogate-Control': 'no-store'});
        res.end(data);
    });
});

passport.serializeUser(function(user, done) {
  console.log('serializeUser', user);
  done(null, user.authId);
});

passport.deserializeUser(function(id, done) {
  console.log('deserializeUser', id);
  var sql = 'SELECT * FROM users WHERE authId=?';
  conn.query(sql, [id], function(err, results){
    done(null, results[0]);
  });
});

var displayName = '';
var IDusername = '';
var score = 0;
passport.use(new LocalStrategy(
  function(username, password, done){
    var uname = username;
    var pwd = password;
    var sql = 'SELECT * FROM users WHERE authId=?';
    conn.query(sql, ['local:'+uname], function(err, results){
      var user = results[0];
        if(!results[0]){
            return done(null, false);
        }
        
        if(pwd === user.password){
          console.log('LocalStrategy', user);
          displayName = user.displayName;
          IDusername = user.username;
          score = user.score;
          done(null, user);
        }
        else {
          done(null, false);
        }
    });
  }
));

app.post(
  '/auth/login',
  passport.authenticate(
    'local',
    {
      successRedirect: '/auth/login_success',
      failureRedirect: '/auth/login_error',
      failureFlash: false
    }
  )
);

var users = [
  {
    authId:'local:admin',
    username:'admin',
    password:'111111',
    displayName:'Master',
    score:0
  }
];

app.post('/auth/register', function(req, res){
    var user = {
      authId:'local:'+req.body.username,
      username:req.body.username,
      password:req.body.password,
      displayName:req.body.displayName,
      score:0
    };
    
    var sqlSelect = 'SELECT username, displayName FROM users';
    conn.query(sqlSelect, [], function(err, results){
          for(var i = 0; i < results.length; i++){
              console.log('~~~~~~~' + results[i].username + ', ' + user.username);
              if(results[i].username === user.username){
                 fs.readFile('views/id_error.html', function(error, data){
                    res.writeHead(200, {'Content-Type':'text/html'});
                    res.end(data);
                });
                  
                  return;
              }
              else if(results[i].displayName === user.displayName){
                 fs.readFile('views/name_error.html', function(error, data){
                    res.writeHead(200, {'Content-Type':'text/html'});
                    res.end(data);
                });
                  
                  return;
              }
              else if(user.displayName === '' || user.username === '' || user.password === ''){
                 fs.readFile('views/blank_error.html', function(error, data){
                    res.writeHead(200, {'Content-Type':'text/html'});
                    res.end(data);
                });
                  
                  return;
              }
          }
        var sqlInsert = 'INSERT INTO users SET ?';
        conn.query(sqlInsert, user, function(err, results){
          if(err){
            console.log(err);
            res.status(500);
          } else {
            req.login(user, function(err){
              fs.readFile('views/register_success.html', function(error, data){
                    res.writeHead(200, {'Content-Type':'text/html'});
                    res.end(data);
                });
            });
          }
        });
    });
});

app.get('/auth/register', function(req, res){
    req.session.save(function(){
        res.redirect('/welcome#openup');
  });
});

app.get('/auth/login', function(req, res){
    res.redirect('/welcome#open');
});

app.get('/auth/login_success', function(req, res){
    
    var sql = 'SELECT score, displayName FROM users ORDER BY score DESC';
    conn.query(sql, [], function(err, results){
        for(var i = 0; i < results.length; i++){
            if(results[i].displayName === displayName){
                var rank = (i / (results.length-1)) * 100;
                rank = rank.toFixed(2);
                
                var user = results[i];
                break;
            }
        }
        
        res.render('profile', {displayName:displayName,
         score:user.score,
         rank:rank});
    });
});

app.post('/auth/edit', function(req, res){
    var sqlSelect = 'SELECT displayName FROM users';
    conn.query(sqlSelect, [], function(err, results){
          for(var i = 0; i < results.length; i++){
              if(req.body.displayName === results[i].displayName){
                  console.log('이미 존재하는 닉네임 입니다.');
                  res.render('editfail', {username:IDusername});
                  
                  return;
              }
              else if(req.body.displayName === '' || req.body.password === ''){
                  console.log('이미 존재하는 닉네임 입니다.');
                  res.render('editblankfail', {username:IDusername});
                  
                  return;
              }
          }
            var sqlUpdate = 'UPDATE users SET displayName=?, password=? WHERE username=?';
            conn.query(sqlUpdate, [req.body.displayName, req.body.password, IDusername], function(err, results){
                if(err){
                    console.log(err);
                    res.status(500);
                  } else {
                    console.log('성공적으로 업데이트 됨');
                    fs.readFile('views/gorelog.html', function(error, data){
                        res.writeHead(200, {'Content-Type':'text/html'});
                        res.end(data);
                    });
                  }
            });
    });
});

app.get('/auth/edit', function(req, res){
    res.render('editpage', {username:IDusername});
});

app.get('/auth/login_error', function(req, res){
    fs.readFile('views/login_error.html', function(error, data){
        res.writeHead(200, {'Content-Type':'text/html'});
        res.end(data);
    });
});

app.get('/auth/play', function(req, res){
    fs.readFile('views/goplay.html', function(error, data){
        res.writeHead(200, {'Content-Type':'text/html'});
        res.end(data);
    });
});

app.get('/auth/game', function(req, res){
    fs.readFile('views/gmain_144.html', function(error, data){
        res.writeHead(200, {'Content-Type':'text/html'});
        res.end(data);
    });
});

app.get('/auth/ranking?:id', function(req, res){ 
    res.render('ranking');
});

var http = require('http');
app.set('port', process.env.PORT || 3004);

var server = http.createServer(app).listen(app.get('port'), function(){
    console.log('Connected 3004 port!');
});
var tmpScore = 0;
var io = require('socket.io').listen(server);
io.sockets.on('connection', function(socket){
    socket.on('send data', function(data){
        tmpScore = data;
        console.log('~~~~~~~!!!!!!!!!!!!!!' + tmpScore + ', ' + data);
        var sqlSelect = 'SELECT score FROM users WHERE displayName=?';
        conn.query(sqlSelect, [displayName], function(err, results){
            var user = results[0];
            if(user.score < data){
                var sqlUpdate = 'UPDATE users SET score=? WHERE displayName=?';
                conn.query(sqlUpdate, [data, displayName], function(err, results){
                    if(err){
                        console.log(err);
                        res.status(500);
                      } else {
                        console.log('성공적으로 업데이트 됨');
                      }
                });
            }
        });
    });
});

//app.listen(3004, function(){
//  console.log('Connected 3004 port!');
//});
