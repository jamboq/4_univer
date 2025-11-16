const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

class Database {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, 'warehouse.db'));
    this.init();
  }

  init() {
    // Создание таблиц
    this.createTables();
    this.insertDefaultData();
  }

  createTables() {
    // Таблица пользователей
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица категорий
    this.db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories (id)
      )
    `);

    // Таблица оборудования
    this.db.run(`
      CREATE TABLE IF NOT EXISTS equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category_id INTEGER NOT NULL,
        subcategory_id INTEGER,
        inventory_number TEXT UNIQUE,
        condition TEXT NOT NULL DEFAULT 'good',
        storage_location TEXT NOT NULL,
        performance TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'available',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        FOREIGN KEY (category_id) REFERENCES categories (id),
        FOREIGN KEY (subcategory_id) REFERENCES categories (id),
        FOREIGN KEY (created_by) REFERENCES users (id)
      )
    `);

    // Таблица истории действий
    this.db.run(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (equipment_id) REFERENCES equipment (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Таблица перемещений
    this.db.run(`
      CREATE TABLE IF NOT EXISTS movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equipment_id INTEGER NOT NULL,
        from_location TEXT,
        to_location TEXT NOT NULL,
        movement_type TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (equipment_id) REFERENCES equipment (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
  }

  async insertDefaultData() {
    // Создание администратора по умолчанию
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    this.db.run(`
      INSERT OR IGNORE INTO users (username, email, password, role) 
      VALUES ('admin', 'admin@theater.com', ?, 'admin')
    `, [hashedPassword]);

    // Создание категорий
    const categories = [
      { name: 'Световое оборудование', parent_id: null },
      { name: 'Электробутафория', parent_id: null },
      { name: 'Дым машины', parent_id: null },
      { name: 'Мастерская', parent_id: null }
    ];

    categories.forEach(category => {
      this.db.run(`
        INSERT OR IGNORE INTO categories (name, parent_id) 
        VALUES (?, ?)
      `, [category.name, category.parent_id]);
    });

    // Создание подкатегорий
    this.db.all('SELECT id FROM categories WHERE name = ?', ['Световое оборудование'], (err, rows) => {
      if (rows.length > 0) {
        const lightingId = rows[0].id;
        this.db.run(`
          INSERT OR IGNORE INTO categories (name, parent_id) 
          VALUES ('Статические приборы', ?)
        `, [lightingId]);
        this.db.run(`
          INSERT OR IGNORE INTO categories (name, parent_id) 
          VALUES ('Динамические приборы', ?)
        `, [lightingId]);
      }
    });

    this.db.all('SELECT id FROM categories WHERE name = ?', ['Электробутафория'], (err, rows) => {
      if (rows.length > 0) {
        const electricalId = rows[0].id;
        this.db.run(`
          INSERT OR IGNORE INTO categories (name, parent_id) 
          VALUES ('220v', ?)
        `, [electricalId]);
        this.db.run(`
          INSERT OR IGNORE INTO categories (name, parent_id) 
          VALUES ('3-24v', ?)
        `, [electricalId]);
      }
    });
  }

  // Методы для работы с пользователями
  createUser(userData) {
    return new Promise((resolve, reject) => {
      const { username, email, password, role = 'user' } = userData;
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return reject(err);
        
        this.db.run(`
          INSERT INTO users (username, email, password, role) 
          VALUES (?, ?, ?, ?)
        `, [username, email, hashedPassword, role], function(err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, username, email, role });
        });
      });
    });
  }

  getUserByUsername(username) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });
  }

  // Методы для работы с оборудованием
  createEquipment(equipmentData) {
    return new Promise((resolve, reject) => {
      const {
        name, description, category_id, subcategory_id, inventory_number,
        condition, storage_location, performance, quantity, status, created_by
      } = equipmentData;

      this.db.run(`
        INSERT INTO equipment (
          name, description, category_id, subcategory_id, inventory_number,
          condition, storage_location, performance, quantity, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        name, description, category_id, subcategory_id, inventory_number,
        condition, storage_location, performance, quantity, status, created_by
      ], function(err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, ...equipmentData });
      });
    });
  }

  getEquipment(filters = {}) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT e.*, c.name as category_name, sc.name as subcategory_name,
               u.username as created_by_name
        FROM equipment e
        LEFT JOIN categories c ON e.category_id = c.id
        LEFT JOIN categories sc ON e.subcategory_id = sc.id
        LEFT JOIN users u ON e.created_by = u.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.search) {
        query += ` AND (e.name LIKE ? OR e.description LIKE ? OR e.inventory_number LIKE ?)`;
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters.category_id) {
        query += ` AND e.category_id = ?`;
        params.push(filters.category_id);
      }

      if (filters.subcategory_id) {
        query += ` AND e.subcategory_id = ?`;
        params.push(filters.subcategory_id);
      }

      if (filters.condition) {
        query += ` AND e.condition = ?`;
        params.push(filters.condition);
      }

      if (filters.status) {
        query += ` AND e.status = ?`;
        params.push(filters.status);
      }

      if (filters.performance) {
        query += ` AND e.performance = ?`;
        params.push(filters.performance);
      }

      query += ` ORDER BY e.updated_at DESC`;

      this.db.all(query, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  updateEquipment(id, updateData) {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updateData);
      values.push(id);

      this.db.run(`
        UPDATE equipment 
        SET ${fields}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, values, function(err) {
        if (err) return reject(err);
        resolve({ id, ...updateData });
      });
    });
  }

  deleteEquipment(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM equipment WHERE id = ?', [id], function(err) {
        if (err) return reject(err);
        resolve({ id });
      });
    });
  }

  // Методы для работы с категориями
  getCategories() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT c.*, 
               (SELECT COUNT(*) FROM equipment WHERE category_id = c.id) as equipment_count
        FROM categories c
        ORDER BY c.parent_id IS NULL DESC, c.name
      `, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  // Методы для работы с историей
  addHistoryEntry(entryData) {
    return new Promise((resolve, reject) => {
      const { equipment_id, user_id, action, old_value, new_value, details } = entryData;
      
      this.db.run(`
        INSERT INTO history (equipment_id, user_id, action, old_value, new_value, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [equipment_id, user_id, action, old_value, new_value, details], function(err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, ...entryData });
      });
    });
  }

  getHistory(filters = {}) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT h.*, e.name as equipment_name, u.username as user_name
        FROM history h
        LEFT JOIN equipment e ON h.equipment_id = e.id
        LEFT JOIN users u ON h.user_id = u.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.equipment_id) {
        query += ` AND h.equipment_id = ?`;
        params.push(filters.equipment_id);
      }

      if (filters.user_id) {
        query += ` AND h.user_id = ?`;
        params.push(filters.user_id);
      }

      query += ` ORDER BY h.created_at DESC LIMIT 100`;

      this.db.all(query, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = new Database();

