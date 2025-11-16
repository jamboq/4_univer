// Модуль для аутентификации и авторизации
class AuthManager {
    constructor(app) {
        this.app = app;
        this.currentUser = null;
        this.token = localStorage.getItem('token');
    }

    // Проверка аутентификации
    async checkAuth() {
        if (!this.token) {
            this.currentUser = null;
            return false;
        }

        try {
            const response = await fetch('/api/users/me', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Ошибка проверки аутентификации:', error);
            this.logout();
            return false;
        }
    }

    // Вход в систему
    async login(username, password) {
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
                this.token = data.token;
                this.currentUser = data.user;
                localStorage.setItem('token', this.token);
                return { success: true, user: this.currentUser };
            } else {
                const error = await response.json();
                return { success: false, error: error.error || 'Ошибка входа' };
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            return { success: false, error: 'Ошибка соединения с сервером' };
        }
    }

    // Регистрация
    async register(userData) {
        try {
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                const data = await response.json();
                this.token = data.token;
                this.currentUser = data.user;
                localStorage.setItem('token', this.token);
                return { success: true, user: this.currentUser };
            } else {
                const error = await response.json();
                return { success: false, error: error.error || 'Ошибка регистрации' };
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            return { success: false, error: 'Ошибка соединения с сервером' };
        }
    }

    // Выход из системы
    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('token');
        this.app.updateUserUI();
    }

    // Получение заголовков авторизации
    getAuthHeaders() {
        if (this.token) {
            return {
                'Authorization': `Bearer ${this.token}`
            };
        }
        return {};
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

    // Проверка роли
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    // Проверка, является ли пользователь администратором
    isAdmin() {
        return this.hasRole('admin');
    }

    // Проверка, может ли пользователь редактировать
    canEdit() {
        return this.hasPermission('write');
    }

    // Проверка, может ли пользователь удалять
    canDelete() {
        return this.hasPermission('delete');
    }

    // Проверка, может ли пользователь управлять пользователями
    canManageUsers() {
        return this.hasPermission('manage_users');
    }

    // Проверка, может ли пользователь управлять категориями
    canManageCategories() {
        return this.hasPermission('manage_categories');
    }

    // Получение информации о текущем пользователе
    getCurrentUser() {
        return this.currentUser;
    }

    // Проверка, аутентифицирован ли пользователь
    isAuthenticated() {
        return !!this.currentUser;
    }

    // Обновление UI в зависимости от статуса аутентификации
    updateUI() {
        const userName = document.getElementById('userName');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userMenu = document.getElementById('userMenu');

        if (this.currentUser) {
            if (userName) userName.textContent = this.currentUser.username;
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            
            // Обновляем меню пользователя
            if (userMenu) {
                const userInfo = document.createElement('div');
                userInfo.className = 'user-info';
                userInfo.innerHTML = `
                    <div class="user-name">${this.currentUser.username}</div>
                    <div class="user-role">${this.getRoleText(this.currentUser.role)}</div>
                `;
                userMenu.insertBefore(userInfo, userMenu.firstChild);
            }
        } else {
            if (userName) userName.textContent = 'Гость';
            if (loginBtn) loginBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            
            // Убираем информацию о пользователе из меню
            if (userMenu) {
                const userInfo = userMenu.querySelector('.user-info');
                if (userInfo) {
                    userInfo.remove();
                }
            }
        }

        // Обновляем видимость элементов в зависимости от прав
        this.updatePermissionBasedUI();
    }

    // Обновление UI в зависимости от прав доступа
    updatePermissionBasedUI() {
        // Кнопки добавления
        const addButtons = document.querySelectorAll('[id*="add"], [id*="Add"]');
        addButtons.forEach(btn => {
            if (this.canEdit()) {
                btn.style.display = 'inline-flex';
            } else {
                btn.style.display = 'none';
            }
        });

        // Кнопки редактирования и удаления
        const editButtons = document.querySelectorAll('[onclick*="edit"], [onclick*="Edit"]');
        const deleteButtons = document.querySelectorAll('[onclick*="delete"], [onclick*="Delete"]');
        
        editButtons.forEach(btn => {
            btn.style.display = this.canEdit() ? 'inline-flex' : 'none';
        });
        
        deleteButtons.forEach(btn => {
            btn.style.display = this.canDelete() ? 'inline-flex' : 'none';
        });

        // Элементы управления пользователями
        const userManagementElements = document.querySelectorAll('[data-permission="manage_users"]');
        userManagementElements.forEach(el => {
            el.style.display = this.canManageUsers() ? 'block' : 'none';
        });

        // Элементы управления категориями
        const categoryManagementElements = document.querySelectorAll('[data-permission="manage_categories"]');
        categoryManagementElements.forEach(el => {
            el.style.display = this.canManageCategories() ? 'block' : 'none';
        });
    }

    // Получение текста роли
    getRoleText(role) {
        const roleTexts = {
            'admin': 'Администратор',
            'manager': 'Менеджер',
            'user': 'Пользователь',
            'viewer': 'Наблюдатель'
        };
        return roleTexts[role] || role;
    }

    // Валидация данных пользователя
    validateUserData(userData, isRegistration = false) {
        const errors = [];

        if (!userData.username || userData.username.trim().length < 3) {
            errors.push('Имя пользователя должно содержать минимум 3 символа');
        }

        if (isRegistration) {
            if (!userData.email || !this.isValidEmail(userData.email)) {
                errors.push('Введите корректный email адрес');
            }

            if (!userData.password || userData.password.length < 6) {
                errors.push('Пароль должен содержать минимум 6 символов');
            }

            if (userData.password !== userData.confirmPassword) {
                errors.push('Пароли не совпадают');
            }
        }

        if (userData.role && !['admin', 'manager', 'user', 'viewer'].includes(userData.role)) {
            errors.push('Некорректная роль пользователя');
        }

        return errors;
    }

    // Проверка валидности email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Обновление токена
    async refreshToken() {
        if (!this.token) return false;

        try {
            const response = await fetch('/api/users/refresh', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.token = data.token;
                localStorage.setItem('token', this.token);
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Ошибка обновления токена:', error);
            this.logout();
            return false;
        }
    }

    // Автоматическое обновление токена
    startTokenRefresh() {
        // Обновляем токен каждые 30 минут
        setInterval(() => {
            if (this.isAuthenticated()) {
                this.refreshToken();
            }
        }, 30 * 60 * 1000);
    }

    // Обработка ошибок авторизации
    handleAuthError(error) {
        if (error.status === 401) {
            this.logout();
            this.app.showNotification('Сессия истекла. Войдите в систему заново.', 'error');
        } else if (error.status === 403) {
            this.app.showNotification('Недостаточно прав доступа', 'error');
        }
    }
}

// Создаем глобальный экземпляр для использования в HTML
let authManager;

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    if (window.app) {
        authManager = new AuthManager(window.app);
        
        // Проверяем аутентификацию при загрузке
        authManager.checkAuth().then(() => {
            authManager.updateUI();
        });
        
        // Запускаем автоматическое обновление токена
        authManager.startTokenRefresh();
    }
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}

