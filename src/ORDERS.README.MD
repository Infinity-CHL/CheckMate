src/
├── pages/
│   └── orders/
│       ├── OrdersPage.tsx           # Главная страница заказов
│       ├── OrderDetailsPage.tsx     # Детальная страница заказа
│       └── CreateOrderPage.tsx      # Создание нового заказа
│
├── features/
│   └── orders/
│       ├── api/
│       │   └── ordersApi.ts         # Запросы к Supabase
│       ├── hooks/
│       │   ├── useOrders.ts         # Получение списка заказов
│       │   ├── useOrderDetails.ts   # Получение деталей заказа
│       │   └── useCreateOrder.ts    # Создание заказа
│       ├── components/
│       │   ├── OrderCard.tsx        # Карточка заказа (для списка)
│       │   ├── OrderList.tsx        # Список заказов
│       │   ├── OrderStatusBadge.tsx # Бейдж статуса
│       │   ├── OrderItemsTable.tsx  # Таблица с товарами в заказе
│       │   └── OrderFilters.tsx     # Фильтры (по статусу, дате)
│       └── types/
│           └── order.types.ts       # TypeScript типы
│
├── entities/
│   └── order/
│       ├── model/
│       │   └── order.model.ts       # Типы и интерфейсы Order
│       ├── lib/
│       │   └── order.utils.ts       # Форматирование статусов, подсчёт суммы
│       └── constants/
│           └── order.constants.ts   # Статусы заказов, варианты
│
└── widgets/
    └── order/
        └── OrderStatsWidget.tsx     # Виджет со статистикой заказов