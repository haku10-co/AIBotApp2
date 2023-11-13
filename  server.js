// server.js

const express = require('express');
const { run } = require('./run'); // run()関数をインポート

const app = express();

app.use(express.static('build')); // ビルドしたファイルを配信

app.get('/ask', async (req, res) => {
  const { question } = req.query;

  const answer = await run(question);

  res.json({ answer });
});

app.get('*', (req, res) => {
  res.sendFile('/build/index.html'); // SPAのindex.htmlを返す
});

app.listen(3000);