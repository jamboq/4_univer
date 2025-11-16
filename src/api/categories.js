const express = require('express');
const router = express.Router();
const db = require('../database/database');

// Получить все категории
router.get('/', async (req, res) => {
  try {
    const categories = await db.getCategories();
    
    // Группируем категории по родительским и дочерним
    const parentCategories = categories.filter(cat => !cat.parent_id);
    const subCategories = categories.filter(cat => cat.parent_id);
    
    const result = parentCategories.map(parent => ({
      ...parent,
      subcategories: subCategories.filter(sub => sub.parent_id === parent.id)
    }));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить категорию по ID
router.get('/:id', async (req, res) => {
  try {
    const categories = await db.getCategories();
    const category = categories.find(cat => cat.id === parseInt(req.params.id));
    
    if (!category) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создать новую категорию
router.post('/', async (req, res) => {
  try {
    const { name, parent_id } = req.body;
    
    // Проверяем, что родительская категория существует (если указана)
    if (parent_id) {
      const categories = await db.getCategories();
      const parentCategory = categories.find(cat => cat.id === parent_id);
      if (!parentCategory) {
        return res.status(400).json({ error: 'Родительская категория не найдена' });
      }
    }
    
    // Здесь нужно добавить метод для создания категории в базе данных
    res.status(201).json({ message: 'Категория создана', name, parent_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить категорию
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent_id } = req.body;
    
    // Здесь нужно добавить метод для обновления категории в базе данных
    res.json({ message: 'Категория обновлена', id, name, parent_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить категорию
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем, есть ли оборудование в этой категории
    const equipment = await db.getEquipment({ category_id: id });
    if (equipment.length > 0) {
      return res.status(400).json({ 
        error: 'Нельзя удалить категорию, в которой есть оборудование' 
      });
    }
    
    // Здесь нужно добавить метод для удаления категории из базы данных
    res.json({ message: 'Категория удалена', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

