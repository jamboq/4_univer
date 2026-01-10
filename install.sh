#!/bin/bash

# Скрипт установки для Theater Lighting Warehouse

echo "🎭 Установка системы управления складом светового оборудования театра"
echo "=================================================================="

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден. Пожалуйста, установите Node.js 16+ с https://nodejs.org/"
    exit 1
fi

# Проверка версии Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Требуется Node.js версии 16 или выше. Текущая версия: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) найден"

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Зависимости установлены успешно"
else
    echo "❌ Ошибка установки зависимостей"
    exit 1
fi

# Создание директории для базы данных
echo "🗄️ Создание директории для базы данных..."
mkdir -p src/database

# Установка прав на выполнение скриптов
chmod +x run.sh
chmod +x install.sh

echo ""
echo "🎉 Установка завершена!"
echo ""
echo "Для запуска приложения используйте:"
echo "  Веб версия:    ./run.sh start  или  npm start"
echo "  Разработка:    ./run.sh dev    или  npm run dev"
echo ""
echo "Учетные данные по умолчанию:"
echo "  Логин: admin"
echo "  Пароль: admin123"
echo ""
echo "После запуска откройте http://localhost:3000 в браузере"
echo ""

