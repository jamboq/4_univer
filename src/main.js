const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Импорт API маршрутов
const equipmentRoutes = require('./api/equipment');
const userRoutes = require('./api/users');
const categoryRoutes = require('./api/categories');
const historyRoutes = require('./api/history');

let mainWindow;
let server;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    titleBarStyle: 'hiddenInset',
    show: false // Не показываем окно сразу
  });

  // Запуск локального сервера
  startServer();

  // Ждем запуска сервера, затем загружаем страницу
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.show(); // Показываем окно после загрузки
    
    // Открытие DevTools в режиме разработки
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }
  }, 2000); // Даем серверу время на запуск
}

function startServer() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(bodyParser.json());
  app.use(express.static(path.join(__dirname, '../public')));

  // Инициализация базы данных
  let db;
  try {
    db = require('./database/database');
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
      if (db) {
        const categories = await db.getCategories();
        res.json(categories);
      } else {
        res.json(demoCategories);
      }
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

  // Заглушки для остальных API
  app.post('/api/equipment', (req, res) => {
    res.status(501).json({ error: 'Функция добавления оборудования недоступна в демо-режиме' });
  });

  app.post('/api/users/login', (req, res) => {
    res.json({
      user: { id: 1, username: 'admin', email: 'admin@theater.com', role: 'admin' },
      token: 'demo-token'
    });
  });

  app.get('/api/users/me', (req, res) => {
    res.json({
      user: { id: 1, username: 'admin', email: 'admin@theater.com', role: 'admin' }
    });
  });

  // Главная страница
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  server = app.listen(3000, () => {
    console.log('🎭 Theater Lighting Warehouse (Electron) запущен на порту 3000');
    if (!db) {
      console.log('⚠️ Работает в демо-режиме (база данных недоступна)');
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (server) {
    server.close();
  }
});

// IPC обработчики для Electron
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});
