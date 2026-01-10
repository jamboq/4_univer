#!/bin/bash

# Скрипт запуска Theater Lighting Warehouse (Веб-версия)

case "$1" in
    "start"|"web")
        echo "🌐 Запуск веб-версии..."
        npm start
        ;;
    "dev")
        echo "🔧 Запуск в режиме разработки..."
        npm run dev
        ;;
    *)
        echo "🎭 Theater Lighting Warehouse - Система управления складом светового оборудования"
        echo ""
        echo "Использование: $0 {start|web|dev}"
        echo ""
        echo "  start/web - Запуск веб-сервера на http://localhost:3000"
        echo "  dev       - Запуск в режиме разработки"
        echo ""
        echo "Примеры:"
        echo "  $0 start   # Запуск веб-сервера"
        echo "  $0 web     # Запуск веб-сервера (альтернатива)"
        echo "  $0 dev     # Запуск в режиме разработки"
        echo ""
        exit 1
        ;;
esac

