// content-script.js - основной скрипт расширения
console.log("[EXT_DEBUG] Расширение начало загрузку");

// Проверяем доступность необходимых API
if (typeof window.postMessage !== 'function') {
  console.error("[EXT_DEBUG] window.postMessage не доступен");
}

// Функция для сохранения логов в chrome.storage
function saveLogs(newLog) {
  chrome.storage.local.get("consoleLogs", (result) => {
    try {
      let logs = result.consoleLogs || [];
      logs.push(newLog);
      
      // Ограничиваем количество логов
      if (logs.length > 1000) {
        logs = logs.slice(-1000);
      }
      
      chrome.storage.local.set({ "consoleLogs": logs }, () => {
        if (chrome.runtime.lastError) {
          console.error("[EXT_DEBUG] Ошибка при сохранении логов:", chrome.runtime.lastError);
        } else {
          console.log("[EXT_DEBUG] Лог сохранен, всего логов:", logs.length);
        }
      });
    } catch (error) {
      console.error("[EXT_DEBUG] Ошибка при сохранении лога:", error);
    }
  });
}

// Прослушиваем сообщения от инжектированного скрипта
window.addEventListener("message", function(event) {
  // Проверяем источник сообщений
  if (event.source !== window) return;
  
  if (event.data && event.data.type === "EXT_LOG_CAPTURE") {
    console.log("[EXT_DEBUG] Получено сообщение с логом:", event.data.logData);
    saveLogs(event.data.logData);
  }
});

// Инжектируем скрипт для перехвата логов
function injectScript() {
  try {
    console.log("[EXT_DEBUG] Начинаем инъекцию page-script.js");
    
    // Проверяем, не был ли уже инжектирован скрипт
    if (document.querySelector('script[src*="page-script.js"]')) {
      console.log("[EXT_DEBUG] Скрипт уже был инжектирован");
      return;
    }

    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('page-script.js');
    
    script.onload = function() {
      console.log("[EXT_DEBUG] Скрипт page-script.js успешно загружен");
      this.remove(); // Удаляем скрипт после загрузки
    };
    
    script.onerror = function(error) {
      console.error("[EXT_DEBUG] Ошибка при загрузке page-script.js:", error);
    };
    
    // Добавляем скрипт в начало head для максимальной приоритетности
    if (document.head) {
      document.head.insertBefore(script, document.head.firstChild);
    } else {
      document.documentElement.appendChild(script);
    }
    
    console.log("[EXT_DEBUG] Скрипт добавлен в DOM");
  } catch (error) {
    console.error("[EXT_DEBUG] Ошибка при инъекции скрипта:", error);
  }
}

// Создаем кнопку для скачивания логов
function createDownloadButton() {
  try {
    console.log("[EXT_DEBUG] Создаем кнопку скачивания");
    
    // Проверяем, существует ли уже кнопка
    if (document.getElementById("downloadLogsButton")) {
      return;
    }
    
    const button = document.createElement("button");
    button.id = "downloadLogsButton";
    button.innerText = "Скачать логи";
    button.style.position = "fixed";
    button.style.bottom = "20px";
    button.style.right = "20px";
    button.style.padding = "10px";
    button.style.background = "#007bff";
    button.style.color = "#fff";
    button.style.border = "none";
    button.style.borderRadius = "5px";
    button.style.cursor = "pointer";
    button.style.zIndex = "9999";
    
    button.addEventListener("click", function() {
      chrome.storage.local.get("consoleLogs", (result) => {
        try {
          const logs = result.consoleLogs || [];
          console.log("[EXT_DEBUG] Скачивание логов, количество:", logs.length);
          
          const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          
          const a = document.createElement("a");
          a.href = url;
          a.download = `console_logs_${new Date().toISOString().replace(/:/g, '-')}.json`;
          document.body.appendChild(a);
          a.click();
          
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
        } catch (error) {
          console.error("[EXT_DEBUG] Ошибка при скачивании логов:", error);
        }
      });
    });
    
    document.body.appendChild(button);
  } catch (error) {
    console.error("[EXT_DEBUG] Ошибка при создании кнопки:", error);
  }
}

// Запускаем инъекцию скрипта
console.log("[EXT_DEBUG] Запускаем инъекцию скрипта");
injectScript();

// Создаем кнопку скачивания при загрузке
if (document.readyState === "complete" || document.readyState === "interactive") {
  createDownloadButton();
} else {
  document.addEventListener("DOMContentLoaded", createDownloadButton);
}

// Обработчик для взаимодействия с popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getLogs") {
    chrome.storage.local.get("consoleLogs", (result) => {
      sendResponse({ logs: result.consoleLogs || [] });
    });
    return true; // для асинхронного ответа
  }
});

console.log("[EXT_DEBUG] Content script полностью загружен");