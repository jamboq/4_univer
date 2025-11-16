const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Инициализация базы данных
let db;
try {
    db = require('./src/database/database');
    console.log('✅ База данных подключена');
} catch (error) {
    console.log('⚠️ База данных недоступна, используем демо-данные');
    db = null;
}

// Демо-данные
const demoCategories = [
    {
        id: 1,
        name: 'Световое оборудование',
        parent_id: null,
        equipment_count: 15,
        subcategories: [
            { id: 2, name: 'Статические приборы', parent_id: 1, equipment_count: 8 },
            { id: 3, name: 'Динамические приборы', parent_id: 1, equipment_count: 7 }
        ]
    },
    {
        id: 4,
        name: 'Электробутафория',
        parent_id: null,
        equipment_count: 12,
        subcategories: [
            { id: 5, name: '220v', parent_id: 4, equipment_count: 6 },
            { id: 6, name: '3-24v', parent_id: 4, equipment_count: 6 }
        ]
    },
    {
        id: 7,
        name: 'Дым машины',
        parent_id: null,
        equipment_count: 3,
        subcategories: []
    },
    {
        id: 8,
        name: 'Мастерская',
        parent_id: null,
        equipment_count: 5,
        subcategories: []
    }
];

const demoEquipment = [
    {
        id: 1,
        name: 'Прожектор PAR64',
        description: 'Светодиодный прожектор с цветными фильтрами',
        category_id: 1,
        subcategory_id: 2,
        category_name: 'Световое оборудование',
        subcategory_name: 'Статические приборы',
        inventory_number: 'SP-001',
        condition: 'excellent',
        status: 'available',
        storage_location: 'Склад А, полка 1',
        performance: 'Лебединое озеро',
        quantity: 2,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        created_by_name: 'admin'
    },
    {
        id: 2,
        name: 'Сканер лазерный',
        description: 'Лазерный сканер для световых эффектов',
        category_id: 1,
        subcategory_id: 3,
        category_name: 'Световое оборудование',
        subcategory_name: 'Динамические приборы',
        inventory_number: 'DP-002',
        condition: 'good',
        status: 'in_use',
        storage_location: 'Сцена, левая сторона',
        performance: 'Щелкунчик',
        quantity: 1,
        created_at: '2024-01-16T14:30:00Z',
        updated_at: '2024-01-16T14:30:00Z',
        created_by_name: 'admin'
    },
    {
        id: 3,
        name: 'Дым-машина Antari',
        description: 'Профессиональная дым-машина',
        category_id: 7,
        subcategory_id: null,
        category_name: 'Дым машины',
        subcategory_name: null,
        inventory_number: 'DM-001',
        condition: 'good',
        status: 'maintenance',
        storage_location: 'Мастерская',
        performance: null,
        quantity: 1,
        created_at: '2024-01-17T09:15:00Z',
        updated_at: '2024-01-17T09:15:00Z',
        created_by_name: 'admin'
    }
];

const demoHistory = [
    {
        id: 1,
        equipment_id: 1,
        equipment_name: 'Прожектор PAR64',
        user_name: 'admin',
        action: 'created',
        details: 'Оборудование добавлено в систему',
        created_at: '2024-01-15T10:00:00Z'
    },
    {
        id: 2,
        equipment_id: 2,
        equipment_name: 'Сканер лазерный',
        user_name: 'admin',
        action: 'moved',
        old_value: 'Склад А, полка 2',
        new_value: 'Сцена, левая сторона',
        details: 'Перемещение: Склад А, полка 2 → Сцена, левая сторона. Причина: Подготовка к спектаклю',
        created_at: '2024-01-16T14:30:00Z'
    },
    {
        id: 3,
        equipment_id: 3,
        equipment_name: 'Дым-машина Antari',
        user_name: 'admin',
        action: 'updated',
        old_value: '{"status":"available"}',
        new_value: '{"status":"maintenance"}',
        details: 'Оборудование обновлено',
        created_at: '2024-01-17T09:15:00Z'
    }
];

// API маршруты
app.get('/api/categories', async (req, res) => {
    try {
        let categories;
        if (db) {
            categories = await db.getCategories();
        } else {
            categories = demoCategories;
        }
        
        // Убираем дубликаты на уровне сервера
        const uniqueCategories = [];
        const seenIds = new Set();
        const seenNames = new Set();
        
        categories.forEach(category => {
            // Проверяем и по ID, и по имени
            const isDuplicate = seenIds.has(category.id) || 
                               (category.name && seenNames.has(category.name));
            
            if (!isDuplicate) {
                seenIds.add(category.id);
                if (category.name) {
                    seenNames.add(category.name);
                }
                uniqueCategories.push(category);
            }
        });
        
        res.json(uniqueCategories);
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        res.json(demoCategories);
    }
});

app.get('/api/equipment', async (req, res) => {
    try {
        if (db) {
            const equipment = await db.getEquipment(req.query);
            res.json(equipment);
        } else {
            res.json(demoEquipment);
        }
    } catch (error) {
        console.error('Ошибка загрузки оборудования:', error);
        res.json(demoEquipment);
    }
});

app.get('/api/history/recent', async (req, res) => {
    try {
        if (db) {
            const history = await db.getHistory({});
            res.json(history.slice(0, 10));
        } else {
            res.json(demoHistory);
        }
    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
        res.json(demoHistory);
    }
});

app.get('/api/history', async (req, res) => {
    try {
        if (db) {
            const history = await db.getHistory({});
            res.json(history);
        } else {
            res.json(demoHistory);
        }
    } catch (error) {
        console.error('Ошибка загрузки полной истории:', error);
        res.json(demoHistory);
    }
});

// API для оборудования
app.post('/api/equipment', async (req, res) => {
    try {
        if (db) {
            const equipmentData = {
                ...req.body,
                created_by: 1 // Временное решение для тестирования
            };
            
            const equipment = await db.createEquipment(equipmentData);
            
            // Добавляем запись в историю
            await db.addHistoryEntry({
                equipment_id: equipment.id,
                user_id: 1,
                action: 'created',
                new_value: JSON.stringify(equipment),
                details: 'Оборудование добавлено в систему'
            });
            
            res.status(201).json(equipment);
        } else {
            // В демо-режиме создаем виртуальное оборудование
            const newEquipment = {
                id: Date.now(),
                ...req.body,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by_name: 'admin'
            };
            res.status(201).json(newEquipment);
        }
    } catch (error) {
        console.error('Ошибка создания оборудования:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/equipment/:id', async (req, res) => {
    try {
        if (db) {
            const { id } = req.params;
            const updateData = req.body;
            
            const updatedEquipment = await db.updateEquipment(id, updateData);
            
            // Добавляем запись в историю
            await db.addHistoryEntry({
                equipment_id: id,
                user_id: 1,
                action: 'updated',
                new_value: JSON.stringify(updatedEquipment),
                details: 'Оборудование обновлено'
            });
            
            res.json(updatedEquipment);
        } else {
            res.status(501).json({ error: 'Редактирование недоступно в демо-режиме' });
        }
    } catch (error) {
        console.error('Ошибка обновления оборудования:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/equipment/:id', async (req, res) => {
    try {
        if (db) {
            const { id } = req.params;
            
            await db.deleteEquipment(id);
            
            // Добавляем запись в историю
            await db.addHistoryEntry({
                equipment_id: id,
                user_id: 1,
                action: 'deleted',
                details: 'Оборудование удалено из системы'
            });
            
            res.json({ message: 'Оборудование удалено' });
        } else {
            res.status(501).json({ error: 'Удаление недоступно в демо-режиме' });
        }
    } catch (error) {
        console.error('Ошибка удаления оборудования:', error);
        res.status(500).json({ error: error.message });
    }
});

// API для пользователей
app.post('/api/users/login', (req, res) => {
    const { username, password } = req.body;
    
    // Простая проверка для демо-режима
    if (username === 'admin' && password === 'admin123') {
        const token = 'demo-token-' + Date.now();
        res.json({
            user: { id: 1, username: 'admin', email: 'admin@theater.com', role: 'admin' },
            token: token
        });
    } else {
        res.status(401).json({ error: 'Неверные учетные данные' });
    }
});

app.post('/api/users/register', (req, res) => {
    const { username, email, password, role = 'user' } = req.body;
    
    // Простая регистрация для демо-режима
    if (username && email && password) {
        const newUser = {
            id: Date.now(),
            username,
            email,
            role,
            created_at: new Date().toISOString()
        };
        
        const token = 'demo-token-' + Date.now();
        res.status(201).json({
            user: newUser,
            token: token
        });
    } else {
        res.status(400).json({ error: 'Не все поля заполнены' });
    }
});

app.get('/api/users/me', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token && token.startsWith('demo-token')) {
        res.json({
            user: { id: 1, username: 'admin', email: 'admin@theater.com', role: 'admin' }
        });
    } else {
        res.status(401).json({ error: 'Токен недействителен' });
    }
});

// API для удаления категорий
app.delete('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (db) {
            // Проверяем, есть ли оборудование в этой категории
            const equipment = await db.getEquipment({ category_id: id });
            if (equipment.length > 0) {
                return res.status(400).json({ 
                    error: 'Нельзя удалить категорию, в которой есть оборудование' 
                });
            }
            
            // Здесь нужно добавить метод для удаления категории из базы данных
            // Пока возвращаем успех для демо-режима
            res.json({ message: 'Категория удалена', id });
        } else {
            res.json({ message: 'Категория удалена (демо-режим)', id });
        }
    } catch (error) {
        console.error('Ошибка удаления категории:', error);
        res.status(500).json({ error: error.message });
    }
});

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Обработка 404
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🎭 Theater Lighting Warehouse запущен на http://localhost:${PORT}`);
    console.log(`📱 Откройте браузер и перейдите по адресу выше`);
    console.log(`🔧 Для остановки нажмите Ctrl+C`);
    if (!db) {
        console.log(`⚠️ Работает в демо-режиме (база данных недоступна)`);
    }
});

module.exports = app;
