// File di test temporaneo da mettere nella root
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Test server funzionante - Il problema era nel codice compilato');
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});