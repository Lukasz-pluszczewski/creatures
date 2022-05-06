const http = require('http');
const path = require('path');
const express = require('express');

const port = process.env.PORT || 5000;

const app = express();
app.server = http.createServer(app);

app.use(express.static(path.join(__dirname, '../build'), { fallthrough: true }));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

app.server.listen(port);

console.log(`Started on port ${app.server.address().port}`); // eslint-disable-line no-console
