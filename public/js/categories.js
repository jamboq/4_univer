// Модуль для работы с категориями
class CategoryManager {
    constructor(app) {
        this.app = app;
        this.categories = [];
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
                    // Проверяем и по ID, и по имени (для случаев дубликатов)
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
                return this.categories;
            } else {
                throw new Error('Ошибка загрузки категорий');
            }
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
            this.app.showNotification('Ошибка загрузки категорий', 'error');
            return [];
        }
    }

    async createCategory(categoryData) {
        try {
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(categoryData)
            });

            if (response.ok) {
                const newCategory = await response.json();
                this.categories.push(newCategory);
                return newCategory;
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка создания категории');
            }
        } catch (error) {
            console.error('Ошибка создания категории:', error);
            throw error;
        }
    }

    async updateCategory(id, updateData) {
        try {
            const response = await fetch(`/api/categories/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                const updatedCategory = await response.json();
                const index = this.categories.findIndex(cat => cat.id === id);
                if (index !== -1) {
                    this.categories[index] = updatedCategory;
                }
                return updatedCategory;
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка обновления категории');
            }
        } catch (error) {
            console.error('Ошибка обновления категории:', error);
            throw error;
        }
    }

    async deleteCategory(id) {
        try {
            const response = await fetch(`/api/categories/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                this.categories = this.categories.filter(cat => cat.id !== id);
                return true;
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка удаления категории');
            }
        } catch (error) {
            console.error('Ошибка удаления категории:', error);
            throw error;
        }
    }

    // Получение всех родительских категорий
    getParentCategories() {
        return this.categories.filter(category => !category.parent_id);
    }

    // Получение подкатегорий для родительской категории
    getSubcategories(parentId) {
        return this.categories.filter(category => category.parent_id === parentId);
    }

    // Получение категории по ID
    getCategoryById(id) {
        return this.categories.find(category => category.id === id);
    }

    // Получение полного пути категории (родитель -> дочерняя)
    getCategoryPath(categoryId) {
        const category = this.getCategoryById(categoryId);
        if (!category) return '';

        if (category.parent_id) {
            const parent = this.getCategoryById(category.parent_id);
            return parent ? `${parent.name} → ${category.name}` : category.name;
        }

        return category.name;
    }

    // Построение иерархического дерева категорий
    buildCategoryTree() {
        const tree = [];
        const categoryMap = new Map();
        const seenIds = new Set();
        const seenParentIds = new Set();
        const seenNames = new Set(); // Проверка по имени для дополнительной защиты

        // Сначала убираем дубликаты из массива категорий (по ID и по имени)
        const uniqueCategories = [];
        this.categories.forEach(category => {
            // Проверяем и по ID, и по имени (для случаев, когда ID могут повторяться)
            const key = `${category.id}_${category.name}`;
            if (!seenIds.has(category.id) && !seenNames.has(category.name)) {
                seenIds.add(category.id);
                seenNames.add(category.name);
                uniqueCategories.push(category);
            }
        });

        // Создаем карту всех категорий
        uniqueCategories.forEach(category => {
            if (!categoryMap.has(category.id)) {
                categoryMap.set(category.id, {
                    ...category,
                    subcategories: []
                });
            }
        });

        // Строим дерево, проверяя на дубликаты
        uniqueCategories.forEach(category => {
            if (category.parent_id) {
                const parent = categoryMap.get(category.parent_id);
                if (parent) {
                    // Проверяем, что подкатегория еще не добавлена (по ID и по имени)
                    const subExists = parent.subcategories.some(sub => 
                        sub.id === category.id || sub.name === category.name
                    );
                    if (!subExists) {
                        parent.subcategories.push(categoryMap.get(category.id));
                    }
                }
            } else {
                // Проверяем, что родительская категория еще не добавлена в дерево
                // Проверяем и по ID, и по имени
                const existsInTree = tree.some(cat => 
                    cat.id === category.id || cat.name === category.name
                );
                if (!existsInTree && !seenParentIds.has(category.id)) {
                    seenParentIds.add(category.id);
                    tree.push(categoryMap.get(category.id));
                }
            }
        });

        return tree;
    }

    // Рендеринг списка категорий
    renderCategoriesList() {
        const categoriesList = document.getElementById('categoriesList');
        if (!categoriesList) return;

        // Предотвращаем множественные вызовы
        if (this._renderingCategories) {
            return;
        }
        this._renderingCategories = true;

        if (this.categories.length === 0) {
            categoriesList.innerHTML = '<p class="text-center text-muted">Категории не найдены</p>';
            this._renderingCategories = false;
            return;
        }

        // Полностью очищаем список перед рендерингом
        categoriesList.innerHTML = '';

        const tree = this.buildCategoryTree();
        categoriesList.innerHTML = tree.map(category => this.renderCategoryItem(category)).join('');

        // Сбрасываем флаг через небольшую задержку
        setTimeout(() => {
            this._renderingCategories = false;
        }, 100);
    }

    renderCategoryItem(category) {
        const subcategoriesHtml = category.subcategories.length > 0 
            ? `<div class="subcategories">
                ${category.subcategories.map(sub => `
                    <div class="subcategory-item" onclick="categoryManager.openCategory(${sub.id})" role="button">
                        ${sub.name}
                        <span class="subcategory-count">${sub.equipment_count || 0}</span>
                    </div>
                `).join('')}
               </div>`
            : '';

        return `
            <div class="category-item" data-id="${category.id}">
                <div class="category-header" onclick="categoryManager.openCategory(${category.id})" role="button">
                    <div class="category-name">${category.name}</div>
                    <div class="category-count">${category.equipment_count || 0}</div>
                </div>
                ${subcategoriesHtml}
                <div class="category-actions">
                    <button class="btn btn-sm btn-secondary" onclick="categoryManager.editCategory(${category.id})">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="categoryManager.handleCategoryDelete(${category.id})">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </div>
            </div>
        `;
    }

    // Открытие категории: показываем оборудование в этой (или дочерней) категории
    openCategory(id) {
        const category = this.getCategoryById(id);
        if (!category) {
            this.app.showNotification('Категория не найдена', 'error');
            return;
        }

        // Переходим на страницу оборудования
        if (this.app && typeof this.app.navigateToPage === 'function') {
            this.app.navigateToPage('equipment');
        }

        // Устанавливаем фильтр по категории
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.value = id;
        }

        // Обновляем список оборудования с учетом фильтра
        if (this.app && typeof this.app.handleFilterChange === 'function') {
            this.app.handleFilterChange();
        } else if (this.app && typeof this.app.loadEquipment === 'function') {
            // Запасной вариант, если метод фильтрации недоступен
            this.app.loadEquipment({ category_id: id });
        }
    }

    // Заполнение селектов категорий
    populateCategorySelect(selectElement, includeSubcategories = true) {
        selectElement.innerHTML = '<option value="">Выберите категорию</option>';
        
        this.categories.forEach(category => {
            if (!category.parent_id) {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                selectElement.appendChild(option);
                
                if (includeSubcategories && category.subcategories) {
                    category.subcategories.forEach(subcategory => {
                        const subOption = document.createElement('option');
                        subOption.value = subcategory.id;
                        subOption.textContent = `  └ ${subcategory.name}`;
                        selectElement.appendChild(subOption);
                    });
                }
            }
        });
    }

    // Валидация данных категории
    validateCategoryData(data) {
        const errors = [];

        if (!data.name || data.name.trim().length === 0) {
            errors.push('Название категории обязательно для заполнения');
        }

        if (data.name && this.categories.some(cat => 
            cat.name.toLowerCase() === data.name.toLowerCase() && 
            cat.parent_id === data.parent_id && 
            cat.id !== data.id
        )) {
            errors.push('Категория с таким названием уже существует');
        }

        if (data.parent_id && !this.getCategoryById(data.parent_id)) {
            errors.push('Выбранная родительская категория не существует');
        }

        return errors;
    }

    // Поиск категорий
    searchCategories(query) {
        if (!query) return this.categories;
        
        const searchTerm = query.toLowerCase();
        return this.categories.filter(category => 
            category.name.toLowerCase().includes(searchTerm)
        );
    }

    // Получение статистики по категориям
    getCategoryStats() {
        const stats = {};
        
        this.categories.forEach(category => {
            if (!category.parent_id) {
                stats[category.name] = {
                    total: category.equipment_count || 0,
                    subcategories: category.subcategories ? category.subcategories.length : 0
                };
            }
        });

        return stats;
    }

    // Экспорт категорий в JSON
    exportToJSON() {
        const data = {
            categories: this.categories,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `categories_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.app.showNotification('Категории экспортированы в JSON', 'success');
    }

    // Редактирование категории
    editCategory(id) {
        const category = this.getCategoryById(id);
        if (!category) return;

        // Заполняем форму редактирования
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryParent').value = category.parent_id || '';
        
        // Показываем модальное окно
        this.app.showCategoryModal();
        
        // Меняем заголовок и обработчик
        const modalHeader = document.querySelector('#categoryModal .modal-header h3');
        const form = document.getElementById('categoryForm');
        
        modalHeader.textContent = 'Редактировать категорию';
        
        // Удаляем старый обработчик и добавляем новый
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCategoryUpdate(id);
        });
    }

    async handleCategoryUpdate(id) {
        const formData = {
            name: document.getElementById('categoryName').value,
            parent_id: document.getElementById('categoryParent').value || null
        };

        const errors = this.validateCategoryData({ ...formData, id });
        if (errors.length > 0) {
            this.app.showNotification(errors.join(', '), 'error');
            return;
        }

        try {
            await this.updateCategory(id, formData);
            this.app.hideModal(document.getElementById('categoryModal'));
            this.app.showNotification('Категория обновлена', 'success');
            this.loadCategories();
            this.renderCategoriesList();
        } catch (error) {
            this.app.showNotification(error.message, 'error');
        }
    }

    async handleCategoryDelete(id) {
        const category = this.getCategoryById(id);
        if (!category) {
            this.app.showNotification('Категория не найдена', 'error');
            return;
        }

        // Проверяем, есть ли подкатегории
        const subcategories = this.getSubcategories(id);
        if (subcategories.length > 0) {
            this.app.showNotification('Нельзя удалить категорию с подкатегориями. Сначала удалите подкатегории.', 'error');
            return;
        }

        if (category.equipment_count > 0) {
            this.app.showNotification('Нельзя удалить категорию с оборудованием', 'error');
            return;
        }

        if (confirm(`Вы уверены, что хотите удалить категорию "${category.name}"?`)) {
            try {
                await this.deleteCategory(id);
                
                // Удаляем из локального массива
                this.categories = this.categories.filter(cat => cat.id !== id);
                
                // Обновляем отображение
                this.renderCategoriesList();
                
                this.app.showNotification('Категория удалена', 'success');
            } catch (error) {
                console.error('Ошибка удаления категории:', error);
                this.app.showNotification(error.message || 'Ошибка удаления категории', 'error');
            }
        }
    }
}

// Создаем глобальный экземпляр для использования в HTML
let categoryManager;

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    if (window.app) {
        categoryManager = new CategoryManager(window.app);
        window.categoryManager = categoryManager; // Делаем доступным глобально
    }
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryManager;
}

