import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`
  🚀  APL CORE SERVER ONLINE & RUNNING ON PORT:${PORT}
  `);
});