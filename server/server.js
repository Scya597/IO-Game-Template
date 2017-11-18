import express from 'express';
import bodyParser from 'body-parser';
import _ from 'lodash';
import config from './config';
import setting from './setting';

const path = require('path');
const http = require('http');

const app = express();


if (process.env.NODE_ENV === 'dev') {
  const webpackMiddleware = require('webpack-dev-middleware');
  const webpackHotMiddleware = require('webpack-hot-middleware');
  const webpack = require('webpack');
  const webpackDevConfig = require('../webpack.dev.config.js');
  const compiler = webpack(webpackDevConfig);
  const middleware = webpackMiddleware(compiler, {
    publicPath: webpackDevConfig.output.publicPath,
    stats: { colors: true },
  });
  app.use(middleware);
  app.use(webpackHotMiddleware(compiler));
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
} else {
  app.use(express.static('public'));
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
  });
}

app.use(bodyParser.json());

app.use((err, req, res, next) => {
  res.status(422).send({ error: err.message });
  next();
});

const server = http.createServer(app);
const io = require('socket.io')(server);

const userList = [];
const playerList = [];

// ##################
const startX = 100;
const startY = 100;

// ##################

io.on('connection', (socket) => {
  console.log('New client connected');
  // login
  socket.emit('getUserList', userList);

  socket.on('setName', (name) => {
    userList.push(name);
    io.emit('getUserList', userList);
  });
  // pixi
  socket.on('createPlayer', (uuid) => {
    playerList.push({ uuid, x: startX, y: startY });
  });
  socket.on('mouseMove', (uuid, theta) => {
    _.find(playerList, { uuid }).theta = theta;
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(config.port, config.host, () => {
  console.info('Express listening on port', config.port);
  console.log(process.env.NODE_ENV);
});
