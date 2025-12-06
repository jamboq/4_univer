const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// API заглушки для демонстрации
app.get('/api/categories', (req, res) => {
    res.json([
        {
            id: 1,
            name: 'Световое оборудование',
            parent_id: null,
            equipment_count: 15,
            subcategories: []
        },
        {
            id: 4,
            name: 'Электробутафория',
            parent_id: null,
            equipment_count: 12,
            subcategories: []
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
    ]);
});

app.get('/api/equipment', (req, res) => {
    res.json([
        {
            id: 1,
            name: 'Прожектор PAR64',
            description: 'Светодиодный прожектор с цветными фильтрами',
            category_id: 1,
            subcategory_id: null,
            category_name: 'Световое оборудование',
            subcategory_name: null,
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
            subcategory_id: null,
            category_name: 'Световое оборудование',
            subcategory_name: null,
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
    ]);
});

app.get('/api/history/recent', (req, res) => {
    res.json([
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
    ]);
});

// Обработка всех остальных маршрутов
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
    console.log(`🎭 Theater Lighting Warehouse запущен на http://localhost:${PORT}`);
    console.log(`📱 Откройте браузер и перейдите по адресу выше`);
    console.log(`🔧 Для остановки нажмите Ctrl+C`);
});

