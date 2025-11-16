const express = require('express');
const router = express.Router();
const db = require('../database/database');

// Получить все оборудование с фильтрами
router.get('/', async (req, res) => {
  try {
    const equipment = await db.getEquipment(req.query);
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить оборудование по ID
router.get('/:id', async (req, res) => {
  try {
    const equipment = await db.getEquipment({ id: req.params.id });
    if (equipment.length === 0) {
      return res.status(404).json({ error: 'Оборудование не найдено' });
    }
    res.json(equipment[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создать новое оборудование
router.post('/', async (req, res) => {
  try {
    const equipmentData = {
      ...req.body,
      created_by: req.user?.id || 1 // Временное решение для тестирования
    };
    
    const equipment = await db.createEquipment(equipmentData);
    
    // Добавляем запись в историю
    await db.addHistoryEntry({
      equipment_id: equipment.id,
      user_id: equipmentData.created_by,
      action: 'created',
      new_value: JSON.stringify(equipment),
      details: 'Оборудование добавлено в систему'
    });
    
    res.status(201).json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить оборудование
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Получаем старые данные для истории
    const oldEquipment = await db.getEquipment({ id });
    if (oldEquipment.length === 0) {
      return res.status(404).json({ error: 'Оборудование не найдено' });
    }
    
    const updatedEquipment = await db.updateEquipment(id, updateData);
    
    // Добавляем запись в историю
    await db.addHistoryEntry({
      equipment_id: id,
      user_id: req.user?.id || 1,
      action: 'updated',
      old_value: JSON.stringify(oldEquipment[0]),
      new_value: JSON.stringify(updatedEquipment),
      details: 'Оборудование обновлено'
    });
    
    res.json(updatedEquipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить оборудование
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Получаем данные для истории
    const oldEquipment = await db.getEquipment({ id });
    if (oldEquipment.length === 0) {
      return res.status(404).json({ error: 'Оборудование не найдено' });
    }
    
    await db.deleteEquipment(id);
    
    // Добавляем запись в историю
    await db.addHistoryEntry({
      equipment_id: id,
      user_id: req.user?.id || 1,
      action: 'deleted',
      old_value: JSON.stringify(oldEquipment[0]),
      details: 'Оборудование удалено из системы'
    });
    
    res.json({ message: 'Оборудование удалено' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Переместить оборудование
router.post('/:id/move', async (req, res) => {
  try {
    const { id } = req.params;
    const { to_location, reason, movement_type = 'transfer' } = req.body;
    
    // Получаем текущие данные
    const currentEquipment = await db.getEquipment({ id });
    if (currentEquipment.length === 0) {
      return res.status(404).json({ error: 'Оборудование не найдено' });
    }
    
    const oldLocation = currentEquipment[0].storage_location;
    
    // Обновляем местоположение
    await db.updateEquipment(id, { storage_location: to_location });
    
    // Добавляем запись в историю перемещений
    await db.addHistoryEntry({
      equipment_id: id,
      user_id: req.user?.id || 1,
      action: 'moved',
      old_value: oldLocation,
      new_value: to_location,
      details: `Перемещение: ${oldLocation} → ${to_location}. Причина: ${reason}`
    });
    
    res.json({ message: 'Оборудование перемещено' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

