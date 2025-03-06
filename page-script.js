// Этот скрипт будет инъектирован в страницу через content-script.js

// Функция для инъекции логики перехвата логов непосредственно в контекст страницы
function injectLogCapture() {
  const script = document.createElement('script');
  script.textContent = `
    (function() {
      // Для отладки
      console.log("[EXT_DEBUG] Скрипт перехвата логов загружен");
      
      // Сохраняем оригинальный console.log
      const originalLog = console.log;
      
      // Переопределяем console.log для перехвата
      console.log = function(...args) {
        // Вызываем оригинальный метод
        originalLog.apply(console, args);
        
        try {
          // Проверяем формат логов [EXT]
          if (args.length >= 2 && args[0] === '[EXT]' && typeof args[1] === 'object') {
            // Отправляем сообщение в content script
            window.postMessage({
              type: "EXT_LOG_CAPTURE",
              logData: {
                timestamp: new Date().toISOString(),
                data: args[1]
              }
            }, "*");
          }
        } catch (error) {
          originalLog.call(console, "[EXT_DEBUG] Ошибка в перехватчике:", error);
        }
      };
      
      // Уведомляем, что перехватчик установлен
      originalLog.call(console, "[EXT_DEBUG] Перехватчик console.log установлен");
    })();
  `;
  
  document.head.appendChild(script);
  document.head.removeChild(script); // Удаляем скрипт после выполнения
}

// Инжектируем скрипт перехвата
injectLogCapture();

// Добавляем отладочные сообщения
console.log("[EXT_DEBUG] Content script загружен и готов к перехвату");