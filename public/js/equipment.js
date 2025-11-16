// Модуль для работы с оборудованием
class EquipmentManager {
    constructor(app) {
        this.app = app;
        this.equipment = [];
        this.filters = {};
    }

    async loadEquipment(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`/api/equipment?${queryParams}`);
            
            if (response.ok) {
                this.equipment = await response.json();
                return this.equipment;
            } else {
                throw new Error('Ошибка загрузки оборудования');
            }
        } catch (error) {
            console.error('Ошибка загрузки оборудования:', error);
            this.app.showNotification('Ошибка загрузки оборудования', 'error');
            return [];
        }
    }

    async createEquipment(equipmentData) {
        try {
            const response = await fetch('/api/equipment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(equipmentData)
            });

            if (response.ok) {
                const newEquipment = await response.json();
                this.equipment.unshift(newEquipment);
                return newEquipment;
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка создания оборудования');
            }
        } catch (error) {
            console.error('Ошибка создания оборудования:', error);
            throw error;
        }
    }

    async updateEquipment(id, updateData) {
        try {
            const response = await fetch(`/api/equipment/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                const updatedEquipment = await response.json();
                const index = this.equipment.findIndex(item => item.id === id);
                if (index !== -1) {
                    this.equipment[index] = updatedEquipment;
                }
                return updatedEquipment;
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка обновления оборудования');
            }
        } catch (error) {
            console.error('Ошибка обновления оборудования:', error);
            throw error;
        }
    }

    async deleteEquipment(id) {
        try {
            const response = await fetch(`/api/equipment/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                this.equipment = this.equipment.filter(item => item.id !== id);
                return true;
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка удаления оборудования');
            }
        } catch (error) {
            console.error('Ошибка удаления оборудования:', error);
            throw error;
        }
    }

    async moveEquipment(id, toLocation, reason) {
        try {
            const response = await fetch(`/api/equipment/${id}/move`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    to_location: toLocation,
                    reason: reason,
                    movement_type: 'transfer'
                })
            });

            if (response.ok) {
                // Обновляем местоположение в локальном массиве
                const equipment = this.equipment.find(item => item.id === id);
                if (equipment) {
                    equipment.storage_location = toLocation;
                }
                return true;
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка перемещения оборудования');
            }
        } catch (error) {
            console.error('Ошибка перемещения оборудования:', error);
            throw error;
        }
    }

    searchEquipment(query) {
        if (!query) return this.equipment;
        
        const searchTerm = query.toLowerCase();
        return this.equipment.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            (item.description && item.description.toLowerCase().includes(searchTerm)) ||
            (item.inventory_number && item.inventory_number.toLowerCase().includes(searchTerm)) ||
            (item.performance && item.performance.toLowerCase().includes(searchTerm))
        );
    }

    filterEquipment(filters) {
        let filtered = [...this.equipment];

        if (filters.category_id) {
            filtered = filtered.filter(item => item.category_id == filters.category_id);
        }

        if (filters.subcategory_id) {
            filtered = filtered.filter(item => item.subcategory_id == filters.subcategory_id);
        }

        if (filters.status) {
            filtered = filtered.filter(item => item.status === filters.status);
        }

        if (filters.condition) {
            filtered = filtered.filter(item => item.condition === filters.condition);
        }

        if (filters.performance) {
            filtered = filtered.filter(item => 
                item.performance && item.performance.toLowerCase().includes(filters.performance.toLowerCase())
            );
        }

        if (filters.storage_location) {
            filtered = filtered.filter(item => 
                item.storage_location.toLowerCase().includes(filters.storage_location.toLowerCase())
            );
        }

        return filtered;
    }

    sortEquipment(sortBy, direction = 'asc') {
        const sorted = [...this.equipment];
        
        sorted.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            // Обработка строк
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (direction === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return sorted;
    }

    getEquipmentStats() {
        const total = this.equipment.length;
        const available = this.equipment.filter(item => item.status === 'available').length;
        const inUse = this.equipment.filter(item => item.status === 'in_use').length;
        const maintenance = this.equipment.filter(item => item.status === 'maintenance').length;
        const broken = this.equipment.filter(item => item.status === 'broken').length;

        const excellent = this.equipment.filter(item => item.condition === 'excellent').length;
        const good = this.equipment.filter(item => item.condition === 'good').length;
        const fair = this.equipment.filter(item => item.condition === 'fair').length;
        const poor = this.equipment.filter(item => item.condition === 'poor').length;

        return {
            total,
            byStatus: { available, inUse, maintenance, broken },
            byCondition: { excellent, good, fair, poor }
        };
    }

    getEquipmentByCategory() {
        const grouped = {};
        
        this.equipment.forEach(item => {
            const categoryName = item.category_name || 'Без категории';
            if (!grouped[categoryName]) {
                grouped[categoryName] = [];
            }
            grouped[categoryName].push(item);
        });

        return grouped;
    }

    getEquipmentByPerformance() {
        const grouped = {};
        
        this.equipment.forEach(item => {
            const performance = item.performance || 'Не назначено';
            if (!grouped[performance]) {
                grouped[performance] = [];
            }
            grouped[performance].push(item);
        });

        return grouped;
    }

    exportToCSV() {
        if (this.equipment.length === 0) {
            this.app.showNotification('Нет данных для экспорта', 'error');
            return;
        }

        const headers = [
            'ID', 'Название', 'Описание', 'Категория', 'Подкатегория',
            'Инвентарный номер', 'Состояние', 'Статус', 'Место хранения',
            'Спектакль', 'Количество', 'Создано', 'Обновлено'
        ];

        const rows = this.equipment.map(item => [
            item.id,
            item.name,
            item.description || '',
            item.category_name || '',
            item.subcategory_name || '',
            item.inventory_number || '',
            this.app.getConditionText(item.condition),
            this.app.getStatusText(item.status),
            item.storage_location,
            item.performance || '',
            item.quantity,
            new Date(item.created_at).toLocaleDateString('ru-RU'),
            new Date(item.updated_at).toLocaleDateString('ru-RU')
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `equipment_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.app.showNotification('Данные экспортированы в CSV', 'success');
    }

    // Валидация данных оборудования
    validateEquipmentData(data) {
        const errors = [];

        if (!data.name || data.name.trim().length === 0) {
            errors.push('Название обязательно для заполнения');
        }

        if (!data.category_id) {
            errors.push('Категория обязательна для выбора');
        }

        if (!data.condition) {
            errors.push('Состояние обязательно для выбора');
        }

        if (!data.status) {
            errors.push('Статус обязателен для выбора');
        }

        if (!data.storage_location || data.storage_location.trim().length === 0) {
            errors.push('Место хранения обязательно для заполнения');
        }

        if (!data.quantity || data.quantity < 1) {
            errors.push('Количество должно быть больше 0');
        }

        if (data.inventory_number && this.equipment.some(item => 
            item.inventory_number === data.inventory_number && item.id !== data.id
        )) {
            errors.push('Оборудование с таким инвентарным номером уже существует');
        }

        return errors;
    }

    // Получение оборудования по ID
    getEquipmentById(id) {
        return this.equipment.find(item => item.id === id);
    }

    // Получение оборудования по спектаклю
    getEquipmentByPerformance(performance) {
        return this.equipment.filter(item => 
            item.performance && item.performance.toLowerCase().includes(performance.toLowerCase())
        );
    }

    // Получение оборудования по месту хранения
    getEquipmentByLocation(location) {
        return this.equipment.filter(item => 
            item.storage_location.toLowerCase().includes(location.toLowerCase())
        );
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EquipmentManager;
}

