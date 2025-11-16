const express = require('express');
const router = express.Router();
const db = require('../database/database');

// Получить историю действий
router.get('/', async (req, res) => {
  try {
    const filters = {
      equipment_id: req.query.equipment_id,
      user_id: req.query.user_id
    };
    
    const history = await db.getHistory(filters);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить историю для конкретного оборудования
router.get('/equipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const history = await db.getHistory({ equipment_id: id });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить историю для конкретного пользователя
router.get('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const history = await db.getHistory({ user_id: id });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить последние действия (для главной страницы)
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const history = await db.getHistory({});
    res.json(history.slice(0, limit));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

