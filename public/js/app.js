// Основной файл приложения
class TheaterWarehouseApp {
    constructor() {
        this.currentUser = null;
        this.equipment = [];
        this.categories = [];
        this.history = [];
        this.currentPage = 'dashboard';
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadInitialData();
        this.updateUI();
    }

    setupEventListeners() {
        // Навигация
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateToPage(page);
            });
        });

        // Поиск
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Кнопки добавления
        document.getElementById('addEquipmentBtn')?.addEventListener('click', () => {
            this.showEquipmentModal();
        });
        
        document.getElementById('addEquipmentBtn2')?.addEventListener('click', () => {
            this.showEquipmentModal();
        });

        document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
            this.showCategoryModal();
        });

        // Фильтры
        document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
            this.handleFilterChange();
        });

        document.getElementById('statusFilter')?.addEventListener('change', (e) => {
            this.handleFilterChange();
        });

        document.getElementById('conditionFilter')?.addEventListener('change', (e) => {
            this.handleFilterChange();
        });

        // Модальные окна
        this.setupModalListeners();

        // Формы
        this.setupFormListeners();
    }

    setupModalListeners() {
        // Закрытие модальных окон
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.hideModal(modal);
            });
        });

        // Закрытие по клику вне модального окна
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal);
                }
            });
        });

        // Меню пользователя
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userMenu = document.getElementById('userMenu');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (userMenuBtn && userMenu) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
            });

            document.addEventListener('click', () => {
                userMenu.style.display = 'none';
            });
        }

        // Обработчик кнопки входа
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginModal();
            });
        }

        // Обработчик кнопки выхода
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Обработчик клика по меню пользователя
        if (userMenu) {
            userMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }

    setupFormListeners() {
        // Форма входа
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Форма регистрации
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Переключение между модальными окнами
        const showRegisterBtn = document.getElementById('showRegisterBtn');
        const showLoginBtn = document.getElementById('showLoginBtn');
        
        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', () => {
                this.hideModal(document.getElementById('loginModal'));
                this.showModal('registerModal');
            });
        }
        
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', () => {
                this.hideModal(document.getElementById('registerModal'));
                this.showModal('loginModal');
            });
        }

        // Форма оборудования
        const equipmentForm = document.getElementById('equipmentForm');
        if (equipmentForm) {
            equipmentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEquipmentSubmit();
            });
        }

        // Форма категории
        const categoryForm = document.getElementById('categoryForm');
        if (categoryForm) {
            categoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCategorySubmit();
            });
        }

        // Изменение категории в форме оборудования
        const equipmentCategory = document.getElementById('equipmentCategory');
        const equipmentSubcategory = document.getElementById('equipmentSubcategory');
        
        if (equipmentCategory && equipmentSubcategory) {
            equipmentCategory.addEventListener('change', (e) => {
                this.updateSubcategoryOptions(e.target.value);
            });
        }
    }

    async loadInitialData() {
        try {
            // Загружаем категории
            await this.loadCategories();
            
            // Загружаем оборудование
            await this.loadEquipment();
            
            // Загружаем историю
            await this.loadHistory();
            
            // Проверяем аутентификацию
            await this.checkAuth();
            
            // Если не авторизован, автоматически входим в демо-режиме
            if (!this.currentUser) {
                await this.autoLoginDemo();
            }
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.showNotification('Ошибка загрузки данных', 'error');
        }
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/categories');
            if (response.ok) {
                const categories = await response.json();
                
                // Убираем дубликаты категорий по ID и по имени
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
                        
                        // Убираем дубликаты подкатегорий
                        if (category.subcategories) {
                            const uniqueSubcategories = [];
                            const seenSubIds = new Set();
                            const seenSubNames = new Set();
                            
                            category.subcategories.forEach(sub => {
                                const isSubDuplicate = seenSubIds.has(sub.id) || 
                                                      (sub.name && seenSubNames.has(sub.name));
                                if (!isSubDuplicate) {
                                    seenSubIds.add(sub.id);
                                    if (sub.name) {
                                        seenSubNames.add(sub.name);
                                    }
                                    uniqueSubcategories.push(sub);
                                }
                            });
                            
                            category.subcategories = uniqueSubcategories;
                        }
                        
                        uniqueCategories.push(category);
                    }
                });
                
                this.categories = uniqueCategories;
                this.updateCategoryFilters();
            }
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
        }
    }

    async loadEquipment(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`/api/equipment?${queryParams}`);
            if (response.ok) {
                this.equipment = await response.json();
                this.renderEquipment();
                this.updateStats();
            }
        } catch (error) {
            console.error('Ошибка загрузки оборудования:', error);
        }
    }

    async loadHistory() {
        try {
            const response = await fetch('/api/history/recent?limit=10');
            if (response.ok) {
                this.history = await response.json();
                this.renderRecentActions();
            }
        } catch (error) {
            console.error('Ошибка загрузки истории:', error);
            // Если API недоступен, создаем демо-историю
            this.history = [
                {
                    id: 1,
                    equipment_id: 1,
                    equipment_name: 'Прожектор PAR64',
                    user_name: this.currentUser?.username || 'admin',
                    action: 'created',
                    details: 'Оборудование добавлено в систему',
                    created_at: new Date().toISOString()
                }
            ];
            this.renderRecentActions();
        }
    }

    async loadFullHistory() {
        try {
            const response = await fetch('/api/history');
            if (response.ok) {
                const fullHistory = await response.json();
                this.renderFullHistory(fullHistory);
            } else {
                // Если API недоступен, используем локальную историю
                this.renderFullHistory(this.history || []);
            }
        } catch (error) {
            console.error('Ошибка загрузки полной истории:', error);
            // Используем локальную историю
            this.renderFullHistory(this.history || []);
        }
    }

    async checkAuth() {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await fetch('/api/users/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    this.currentUser = data.user;
                    this.updateUserUI();
                }
            } catch (error) {
                console.error('Ошибка проверки аутентификации:', error);
                localStorage.removeItem('token');
            }
        }
    }

    async autoLoginDemo() {
        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: 'admin', password: 'admin123' })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                this.currentUser = data.user;
                this.updateUserUI();
                console.log('✅ Автоматический вход в демо-режиме выполнен');
                // Показываем уведомление через небольшую задержку
                setTimeout(() => {
                    this.showNotification('Автоматический вход в демо-режиме выполнен', 'success');
                }, 1000);
            }
        } catch (error) {
            console.error('Ошибка автоматического входа:', error);
        }
    }

    navigateToPage(page) {
        // Скрываем все страницы
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        // Показываем выбранную страницу
        const targetPage = document.getElementById(page);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = page;
        }

        // Обновляем навигацию
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-page="${page}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Загружаем данные для страницы
        if (page === 'equipment') {
            this.loadEquipment();
        } else if (page === 'history') {
            this.loadFullHistory();
        } else if (page === 'categories') {
            // Загружаем и отображаем категории
            if (window.categoryManager) {
                window.categoryManager.loadCategories().then(() => {
                    window.categoryManager.renderCategoriesList();
                });
            } else {
                // Если categoryManager еще не инициализирован, загружаем категории через app
                this.loadCategories();
            }
        }
    }

    handleSearch(query) {
        if (this.currentPage === 'equipment') {
            this.loadEquipment({ search: query });
        }
    }

    handleFilterChange() {
        if (this.currentPage === 'equipment') {
            const filters = {
                category_id: document.getElementById('categoryFilter')?.value || '',
                status: document.getElementById('statusFilter')?.value || '',
                condition: document.getElementById('conditionFilter')?.value || ''
            };
            
            // Убираем пустые фильтры
            Object.keys(filters).forEach(key => {
                if (!filters[key]) delete filters[key];
            });
            
            this.loadEquipment(filters);
        }
    }

    updateCategoryFilters() {
        // Проверяем, что категории загружены
        if (!this.categories || this.categories.length === 0) {
            return;
        }

        // Предотвращаем множественные вызовы
        if (this._updatingCategories) {
            return;
        }
        this._updatingCategories = true;

        const categoryFilter = document.getElementById('categoryFilter');
        const equipmentCategory = document.getElementById('equipmentCategory');
        const categoryParent = document.getElementById('categoryParent');

        if (categoryFilter) {
            this.populateCategorySelect(categoryFilter, true);
        }
        
        if (equipmentCategory) {
            this.populateCategorySelect(equipmentCategory, true);
        }
        
        if (categoryParent) {
            this.populateCategorySelect(categoryParent, false);
        }

        // Сбрасываем флаг через небольшую задержку
        setTimeout(() => {
            this._updatingCategories = false;
        }, 100);
    }

    populateCategorySelect(selectElement, includeSubcategories = true) {
        // Всегда полностью очищаем селект перед заполнением
        selectElement.innerHTML = '<option value="">Выберите категорию</option>';
        
        // Используем Set для отслеживания уже добавленных категорий
        const addedCategories = new Set();
        const addedSubcategories = new Set();
        
        this.categories.forEach(category => {
            // Проверяем, что это основная категория и она еще не добавлена
            if (!category.parent_id && !addedCategories.has(category.id)) {
                addedCategories.add(category.id);
                
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                selectElement.appendChild(option);
                
                // Добавляем подкатегории, если нужно
                if (includeSubcategories && category.subcategories) {
                    category.subcategories.forEach(subcategory => {
                        // Проверяем, что подкатегория еще не добавлена
                        if (!addedSubcategories.has(subcategory.id)) {
                            addedSubcategories.add(subcategory.id);
                            const subOption = document.createElement('option');
                            subOption.value = subcategory.id;
                            subOption.textContent = `  └ ${subcategory.name}`;
                            selectElement.appendChild(subOption);
                        }
                    });
                }
            }
        });
    }

    updateSubcategoryOptions(categoryId) {
        const subcategorySelect = document.getElementById('equipmentSubcategory');
        if (!subcategorySelect) return;

        // Всегда полностью очищаем селект
        subcategorySelect.innerHTML = '<option value="">Выберите подкатегорию</option>';
        
        if (categoryId) {
            const category = this.categories.find(cat => cat.id == categoryId);
            if (category && category.subcategories) {
                // Используем Set для отслеживания уже добавленных подкатегорий
                const addedSubIds = new Set();
                
                category.subcategories.forEach(subcategory => {
                    // Проверяем, что подкатегория еще не добавлена
                    if (!addedSubIds.has(subcategory.id)) {
                        addedSubIds.add(subcategory.id);
                        const option = document.createElement('option');
                        option.value = subcategory.id;
                        option.textContent = subcategory.name;
                        subcategorySelect.appendChild(option);
                    }
                });
            }
        }
    }

    renderEquipment() {
        const equipmentGrid = document.getElementById('equipmentGrid');
        if (!equipmentGrid) return;

        if (this.equipment.length === 0) {
            equipmentGrid.innerHTML = '<p class="text-center text-muted">Оборудование не найдено</p>';
            return;
        }

        equipmentGrid.innerHTML = this.equipment.map(item => `
            <div class="equipment-card" data-id="${item.id}">
                <div class="equipment-header">
                    <div>
                        <div class="equipment-name">${item.name}</div>
                        ${item.inventory_number ? `<div class="equipment-inventory">${item.inventory_number}</div>` : ''}
                    </div>
                    <div class="equipment-status status-${item.status}">
                        ${this.getStatusText(item.status)}
                    </div>
                </div>
                <div class="equipment-details">
                    <div class="equipment-detail">
                        <span class="equipment-detail-label">Категория:</span>
                        <span class="equipment-detail-value">${item.category_name}</span>
                    </div>
                    ${item.subcategory_name ? `
                    <div class="equipment-detail">
                        <span class="equipment-detail-label">Подкатегория:</span>
                        <span class="equipment-detail-value">${item.subcategory_name}</span>
                    </div>
                    ` : ''}
                    <div class="equipment-detail">
                        <span class="equipment-detail-label">Состояние:</span>
                        <span class="equipment-detail-value">${this.getConditionText(item.condition)}</span>
                    </div>
                    <div class="equipment-detail">
                        <span class="equipment-detail-label">Место хранения:</span>
                        <span class="equipment-detail-value">${item.storage_location}</span>
                    </div>
                    ${item.performance ? `
                    <div class="equipment-detail">
                        <span class="equipment-detail-label">Спектакль:</span>
                        <span class="equipment-detail-value">${item.performance}</span>
                    </div>
                    ` : ''}
                    <div class="equipment-detail">
                        <span class="equipment-detail-label">Количество:</span>
                        <span class="equipment-detail-value">${item.quantity}</span>
                    </div>
                </div>
                <div class="equipment-actions">
                    ${this.canEditEquipment() ? `
                        <button class="btn btn-sm btn-secondary" onclick="app.editEquipment(${item.id})">
                            <i class="fas fa-edit"></i> Редактировать
                        </button>
                    ` : ''}
                    ${this.canDeleteEquipment() ? `
                        <button class="btn btn-sm btn-danger" onclick="app.deleteEquipment(${item.id})">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderRecentActions() {
        const actionsList = document.getElementById('recentActionsList');
        if (!actionsList) return;

        if (this.history.length === 0) {
            actionsList.innerHTML = '<p class="text-center text-muted">Нет последних действий</p>';
            return;
        }

        actionsList.innerHTML = this.history.map(action => `
            <div class="action-item">
                <div class="action-icon">
                    <i class="fas fa-${this.getActionIcon(action.action)}"></i>
                </div>
                <div class="action-content">
                    <h4>${action.equipment_name}</h4>
                    <p>${this.getActionText(action)}</p>
                </div>
                <div class="action-time">
                    ${this.formatTime(action.created_at)}
                </div>
            </div>
        `).join('');
    }

    renderFullHistory(historyData) {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        if (historyData.length === 0) {
            historyList.innerHTML = '<p class="text-center text-muted">История действий пуста</p>';
            return;
        }

        historyList.innerHTML = historyData.map(action => `
            <div class="history-item">
                <div class="history-icon">
                    <i class="fas fa-${this.getActionIcon(action.action)}"></i>
                </div>
                <div class="history-content">
                    <h4>${action.equipment_name || 'Система'}</h4>
                    <p>${this.getActionText(action)}</p>
                    <small class="text-muted">Пользователь: ${action.user_name}</small>
                </div>
                <div class="history-time">
                    ${this.formatTime(action.created_at)}
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        const total = this.equipment.length;
        const available = this.equipment.filter(item => item.status === 'available').length;
        const maintenance = this.equipment.filter(item => item.status === 'maintenance').length;
        const broken = this.equipment.filter(item => item.status === 'broken').length;

        document.getElementById('totalEquipment').textContent = total;
        document.getElementById('availableEquipment').textContent = available;
        document.getElementById('maintenanceEquipment').textContent = maintenance;
        document.getElementById('brokenEquipment').textContent = broken;
    }

    updateUserUI() {
        const userName = document.getElementById('userName');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userMenuBtn = document.getElementById('userMenuBtn');

        if (this.currentUser) {
            if (userName) {
                const roleText = this.getRoleText(this.currentUser.role);
                userName.textContent = `${this.currentUser.username} (${roleText})`;
            }
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (userMenuBtn) {
                userMenuBtn.style.background = 'rgba(255,255,255,0.3)';
                userMenuBtn.title = `Вошли как ${this.currentUser.username} (${this.getRoleText(this.currentUser.role)})`;
            }
        } else {
            if (userName) userName.textContent = 'Гость';
            if (loginBtn) loginBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userMenuBtn) {
                userMenuBtn.style.background = 'rgba(255,255,255,0.2)';
                userMenuBtn.title = 'Нажмите для входа в систему';
            }
        }

        // Обновляем видимость элементов в зависимости от прав
        this.updatePermissionBasedUI();
    }

    getRoleText(role) {
        const roleTexts = {
            'admin': 'Администратор',
            'manager': 'Менеджер',
            'user': 'Пользователь',
            'viewer': 'Наблюдатель'
        };
        return roleTexts[role] || role;
    }

    updatePermissionBasedUI() {
        // Кнопки добавления оборудования
        const addButtons = document.querySelectorAll('[id*="add"], [id*="Add"]');
        addButtons.forEach(btn => {
            if (this.canAddEquipment()) {
                btn.style.display = 'inline-flex';
                btn.disabled = false;
            } else {
                btn.style.display = 'none';
            }
        });

        // Кнопки редактирования и удаления (если есть)
        const editButtons = document.querySelectorAll('[onclick*="edit"], [onclick*="Edit"]');
        const deleteButtons = document.querySelectorAll('[onclick*="delete"], [onclick*="Delete"]');
        
        editButtons.forEach(btn => {
            btn.style.display = this.canEditEquipment() ? 'inline-flex' : 'none';
        });
        
        deleteButtons.forEach(btn => {
            btn.style.display = this.canDeleteEquipment() ? 'inline-flex' : 'none';
        });

        // Элементы управления пользователями
        const userManagementElements = document.querySelectorAll('[data-permission="manage_users"]');
        userManagementElements.forEach(el => {
            el.style.display = this.canManageUsers() ? 'block' : 'none';
        });
    }

    updateUI() {
        this.updateUserUI();
        this.updateCategoryFilters();
    }

    // Модальные окна
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideModal(modal) {
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showEquipmentModal() {
        this.showModal('equipmentModal');
    }

    showCategoryModal() {
        this.showModal('categoryModal');
    }

    showLoginModal() {
        this.showModal('loginModal');
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('token');
        this.updateUserUI();
        this.showNotification('Вы вышли из системы', 'info');
    }

    async handleRegister() {
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const role = document.getElementById('registerRole').value;

        // Валидация
        if (password !== confirmPassword) {
            this.showNotification('Пароли не совпадают', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Пароль должен содержать минимум 6 символов', 'error');
            return;
        }

        try {
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password, role })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                this.currentUser = data.user;
                this.updateUserUI();
                this.hideModal(document.getElementById('registerModal'));
                this.showNotification('Регистрация успешна!', 'success');
                document.getElementById('registerForm').reset();
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Ошибка регистрации', 'error');
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            this.showNotification('Ошибка регистрации', 'error');
        }
    }

    // Проверка прав доступа
    hasPermission(permission) {
        if (!this.currentUser) return false;

        const permissions = {
            'admin': ['read', 'write', 'delete', 'manage_users', 'manage_categories'],
            'manager': ['read', 'write', 'delete', 'manage_categories'],
            'user': ['read', 'write'],
            'viewer': ['read']
        };

        const userPermissions = permissions[this.currentUser.role] || [];
        return userPermissions.includes(permission);
    }

    canAddEquipment() {
        return this.hasPermission('write');
    }

    canEditEquipment() {
        return this.hasPermission('write');
    }

    canDeleteEquipment() {
        return this.hasPermission('delete');
    }

    canManageUsers() {
        return this.hasPermission('manage_users');
    }

    // Добавление записи в историю
    addHistoryEntry(equipmentName, action, details) {
        if (!this.currentUser) return;

        const historyEntry = {
            id: Date.now(),
            equipment_id: null,
            equipment_name: equipmentName,
            user_name: this.currentUser.username,
            action: action,
            details: details,
            created_at: new Date().toISOString()
        };

        // Добавляем в начало массива
        this.history.unshift(historyEntry);
        
        // Ограничиваем количество записей
        if (this.history.length > 10) {
            this.history = this.history.slice(0, 10);
        }

        // Обновляем отображение
        this.renderRecentActions();
    }

    // Редактирование оборудования
    editEquipment(id) {
        if (!this.canEditEquipment()) {
            this.showNotification('У вас нет прав для редактирования оборудования', 'error');
            return;
        }

        const equipment = this.equipment.find(item => item.id === id);
        if (!equipment) {
            this.showNotification('Оборудование не найдено', 'error');
            return;
        }

        // Заполняем форму редактирования
        document.getElementById('equipmentName').value = equipment.name;
        document.getElementById('equipmentDescription').value = equipment.description || '';
        document.getElementById('equipmentCategory').value = equipment.category_id;
        document.getElementById('equipmentSubcategory').value = equipment.subcategory_id || '';
        document.getElementById('equipmentInventoryNumber').value = equipment.inventory_number || '';
        document.getElementById('equipmentCondition').value = equipment.condition;
        document.getElementById('equipmentStatus').value = equipment.status;
        document.getElementById('equipmentStorageLocation').value = equipment.storage_location;
        document.getElementById('equipmentPerformance').value = equipment.performance || '';
        document.getElementById('equipmentQuantity').value = equipment.quantity;

        // Показываем модальное окно
        this.showEquipmentModal();
        
        // Меняем заголовок и обработчик
        const modalHeader = document.querySelector('#equipmentModal .modal-header h3');
        const form = document.getElementById('equipmentForm');
        
        modalHeader.textContent = 'Редактировать оборудование';
        
        // Удаляем старый обработчик и добавляем новый
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEquipmentUpdate(id);
        });
    }

    // Удаление оборудования
    async deleteEquipment(id) {
        if (!this.canDeleteEquipment()) {
            this.showNotification('У вас нет прав для удаления оборудования', 'error');
            return;
        }

        const equipment = this.equipment.find(item => item.id === id);
        if (!equipment) {
            this.showNotification('Оборудование не найдено', 'error');
            return;
        }

        if (!confirm(`Вы уверены, что хотите удалить оборудование "${equipment.name}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/equipment/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                this.showNotification('Оборудование удалено', 'success');
                
                // Добавляем запись в историю
                this.addHistoryEntry(
                    equipment.name,
                    'deleted',
                    `Оборудование "${equipment.name}" удалено из системы`
                );
                
                // Удаляем из локального массива
                this.equipment = this.equipment.filter(item => item.id !== id);
                this.renderEquipment();
                this.updateStats();
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Ошибка удаления оборудования', 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления оборудования:', error);
            this.showNotification('Ошибка удаления оборудования', 'error');
        }
    }

    // Обновление оборудования
    async handleEquipmentUpdate(id) {
        if (!this.canEditEquipment()) {
            this.showNotification('У вас нет прав для редактирования оборудования', 'error');
            return;
        }

        const formData = {
            name: document.getElementById('equipmentName').value,
            description: document.getElementById('equipmentDescription').value,
            category_id: document.getElementById('equipmentCategory').value,
            subcategory_id: document.getElementById('equipmentSubcategory').value || null,
            inventory_number: document.getElementById('equipmentInventoryNumber').value || null,
            condition: document.getElementById('equipmentCondition').value,
            status: document.getElementById('equipmentStatus').value,
            storage_location: document.getElementById('equipmentStorageLocation').value,
            performance: document.getElementById('equipmentPerformance').value || null,
            quantity: parseInt(document.getElementById('equipmentQuantity').value)
        };

        // Валидация
        if (!formData.name || !formData.category_id || !formData.storage_location) {
            this.showNotification('Заполните все обязательные поля', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/equipment/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const updatedEquipment = await response.json();
                this.hideModal(document.getElementById('equipmentModal'));
                this.showNotification('Оборудование обновлено', 'success');
                
                // Добавляем запись в историю
                this.addHistoryEntry(
                    updatedEquipment.name || formData.name,
                    'updated',
                    `Оборудование "${formData.name}" обновлено`
                );
                
                // Обновляем в локальном массиве
                const index = this.equipment.findIndex(item => item.id === id);
                if (index !== -1) {
                    this.equipment[index] = updatedEquipment;
                }
                
                this.renderEquipment();
                this.updateStats();
                document.getElementById('equipmentForm').reset();
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Ошибка обновления оборудования', 'error');
            }
        } catch (error) {
            console.error('Ошибка обновления оборудования:', error);
            this.showNotification('Ошибка обновления оборудования', 'error');
        }
    }

    // Обработчики форм
    async handleLogin() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                this.currentUser = data.user;
                this.updateUserUI();
                this.hideModal(document.getElementById('loginModal'));
                this.showNotification('Успешный вход в систему', 'success');
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Ошибка входа', 'error');
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            this.showNotification('Ошибка входа в систему', 'error');
        }
    }

    async handleEquipmentSubmit() {
        // Проверяем права доступа
        if (!this.canAddEquipment()) {
            this.showNotification('У вас нет прав для добавления оборудования', 'error');
            return;
        }

        const formData = {
            name: document.getElementById('equipmentName').value,
            description: document.getElementById('equipmentDescription').value,
            category_id: document.getElementById('equipmentCategory').value,
            subcategory_id: document.getElementById('equipmentSubcategory').value || null,
            inventory_number: document.getElementById('equipmentInventoryNumber').value || null,
            condition: document.getElementById('equipmentCondition').value,
            status: document.getElementById('equipmentStatus').value,
            storage_location: document.getElementById('equipmentStorageLocation').value,
            performance: document.getElementById('equipmentPerformance').value || null,
            quantity: parseInt(document.getElementById('equipmentQuantity').value)
        };

        // Валидация
        if (!formData.name || !formData.category_id || !formData.storage_location) {
            this.showNotification('Заполните все обязательные поля', 'error');
            return;
        }

        try {
            const response = await fetch('/api/equipment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const newEquipment = await response.json();
                this.hideModal(document.getElementById('equipmentModal'));
                this.showNotification('Оборудование добавлено', 'success');
                
                // Добавляем запись в историю
                this.addHistoryEntry(
                    newEquipment.name || formData.name,
                    'created',
                    `Оборудование "${formData.name}" добавлено в систему`
                );
                
                // Обновляем список оборудования
                this.loadEquipment();
                this.loadHistory();
                document.getElementById('equipmentForm').reset();
                
                // Добавляем в локальный массив для немедленного отображения
                if (this.equipment) {
                    this.equipment.unshift(newEquipment);
                    this.renderEquipment();
                    this.updateStats();
                }
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Ошибка добавления оборудования', 'error');
            }
        } catch (error) {
            console.error('Ошибка добавления оборудования:', error);
            this.showNotification('Ошибка добавления оборудования', 'error');
        }
    }

    async handleCategorySubmit() {
        const formData = {
            name: document.getElementById('categoryName').value,
            parent_id: document.getElementById('categoryParent').value || null
        };

        try {
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.hideModal(document.getElementById('categoryModal'));
                this.showNotification('Категория добавлена', 'success');
                this.loadCategories();
                document.getElementById('categoryForm').reset();
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Ошибка добавления категории', 'error');
            }
        } catch (error) {
            console.error('Ошибка добавления категории:', error);
            this.showNotification('Ошибка добавления категории', 'error');
        }
    }

    // Утилиты
    getStatusText(status) {
        const statusMap = {
            'available': 'Доступно',
            'in_use': 'В использовании',
            'maintenance': 'На обслуживании',
            'broken': 'Неисправно'
        };
        return statusMap[status] || status;
    }

    getConditionText(condition) {
        const conditionMap = {
            'excellent': 'Отличное',
            'good': 'Хорошее',
            'fair': 'Удовлетворительное',
            'poor': 'Плохое'
        };
        return conditionMap[condition] || condition;
    }

    getActionIcon(action) {
        const iconMap = {
            'created': 'plus',
            'updated': 'edit',
            'deleted': 'trash',
            'moved': 'arrows-alt'
        };
        return iconMap[action] || 'info';
    }

    getActionText(action) {
        const actionMap = {
            'created': 'Добавлено в систему',
            'updated': 'Обновлено',
            'deleted': 'Удалено из системы',
            'moved': `Перемещено: ${action.old_value} → ${action.new_value}`
        };
        return actionMap[action.action] || action.details || 'Действие выполнено';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'только что';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
        return date.toLocaleDateString('ru-RU');
    }

    showNotification(message, type = 'info') {
        // Простая система уведомлений
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#cce5ff'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#004085'};
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TheaterWarehouseApp();
});

// Добавляем стили для анимации уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

