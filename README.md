# CheckMate - система управления заказами для официантов

## 🚀 Технологии

- **Frontend**: React 19, TypeScript, Vite 5
- **UI**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Routing**: React Router
- **PWA**: vite-plugin-pwa

## 📦 Установка

1. Клонируйте репозиторий
2. Установите зависимости:
   \`\`\`bash
   npm install
   \`\`\`
3. Скопируйте \`.env.example\` в \`.env\` и добавьте ключи Supabase
4. Запустите проект:
   \`\`\`bash
   npm run dev
   \`\`\`

## 🗄️ Настройка Supabase

1. Создайте проект в Supabase
2. Выполните SQL запросы из \`docs/schema.sql\`
3. Включите подтверждение email (или отключите для разработки)
4. Добавьте URL редиректа: \`http://localhost:5173/auth/callback\`

## 📁 Структура проекта (FSD)

\`\`\`
src/
├── app/          # Инициализация, роутинг, провайдеры
├── pages/        # Страницы приложения
├── features/     # Фичи (auth, orders, menu)
├── entities/     # Бизнес-сущности
├── shared/       # Переиспользуемый код
└── widgets/      # Композитные компоненты
\`\`\`

## 🔒 Переменные окружения

\`\`\`env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
\`\`\`