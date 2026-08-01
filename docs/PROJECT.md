# Project Life — точка входа

Ты работаешь с репозиторием `NikDoode/ProjectLife`.

Перед обсуждением проекта или предложением следующего шага восстанови контекст по актуальным файлам репозитория.

## Порядок ознакомления

1. Прочитай `docs/architecture.md`.
2. Прочитай `docs/decisions.md`.
3. Прочитай `docs/ui/roadmap.md`.
4. Прочитай `docs/spatial-view.md`.
5. Прочитай `docs/current-state.md`, если файл существует.
6. Прочитай последние записи `docs/dev-log.md`, если файл существует.

После документации изучи текущее устройство проекта:

backend\app\
backend\app\__init__.py
backend\app\api.py
backend\app\crud.py
backend\app\database.py
backend\app\main.py
backend\app\models.py
backend\app\schemas.py

backend\app\services\__init__.py
backend\app\services\tree_projection.py
backend\data\task_manager.db
config.py
docs\index.md
docs\ui-principles.md
docs\ui\spatial-view.md.md
frontend\.gitignore
frontend\dist\assets\index-C3GBtPip.css
frontend\dist\assets\index-D12dIAME.js
frontend\dist\favicon.svg
frontend\dist\icons.svg
frontend\dist\index.html
frontend\eslint.config.js
frontend\index.html
frontend\package-lock.json
frontend\package.json
frontend\public\favicon.svg
frontend\public\icons.svg
frontend\README.md
frontend\src\api\items.js
frontend\src\App.css
frontend\src\App.jsx
frontend\src\assets\hero.png
frontend\src\assets\react.svg
frontend\src\assets\vite.svg
frontend\src\components\ItemDetails\ItemDetails.css
frontend\src\components\ItemDetails\ItemDetails.jsx
frontend\src\components\TodayPanel.css
frontend\src\components\TodayPanel.jsx
frontend\src\index.css
frontend\src\main.jsx
frontend\src\views\SpatialView.css
frontend\src\views\SpatialView.jsx
frontend\src\views\Tree\Tree.css
frontend\src\views\Tree\TreeNode.jsx
frontend\src\views\Tree\TreeView.jsx
frontend\src\views\ViewRenderer.jsx
frontend\vite.config.js
requirements.txt
scripts\backend.bat
scripts\dev.bat
scripts\frontend.bat

## Правила работы

- Считай содержимое репозитория источником истины о текущей реализации.
- Не полагайся только на историю чата, если она расходится с актуальными файлами.
- Отличай:
  - уже реализованное;
  - принятое, но ещё не реализованное;
  - идеи и открытые вопросы.
- Не предлагай крупную переработку до ознакомления с архитектурой и решениями.
- Не изменяй файлы без прямой просьбы пользователя.
- Если какой-либо файл отсутствует или недоступен, сообщи об этом и продолжи с доступными материалами.
- После чтения кратко сообщи:
  1. что уже реализовано;
  2. какие ключевые решения приняты;
  3. на чём остановилась работа;
  4. какой следующий шаг зафиксирован в документации;
  5. какие противоречия или пробелы обнаружены.

## Цель

После выполнения этих инструкций ты должен уметь продолжить обсуждение Project Life без повторного пересказа проекта пользователем.