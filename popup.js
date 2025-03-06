document.addEventListener('DOMContentLoaded', function() {
    const downloadBtn = document.getElementById('downloadBtn');
    const clearBtn = document.getElementById('clearBtn');
    const statusDiv = document.getElementById('status');
    
    // Функция для отображения количества логов
    function updateStatus(count) {
      statusDiv.textContent = `Collected logs: ${count}`;
    }
    
    // Получаем активную вкладку и взаимодействуем с content script
    async function getActiveTab() {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      return tabs[0];
    }
    
    // Скачивание логов
    downloadBtn.addEventListener('click', async function() {
      try {
        const activeTab = await getActiveTab();
        
        chrome.tabs.sendMessage(activeTab.id, { action: "getLogs" }, function(response) {
          if (chrome.runtime.lastError) {
            statusDiv.textContent = 'Error: Script not running on this page';
            return;
          }
          
          if (response && response.logs) {
            const logs = response.logs;
            updateStatus(logs.length);
            
            if (logs.length === 0) {
              statusDiv.textContent = 'No logs to download';
              return;
            }
            
            const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement("a");
            a.href = url;
            a.download = `console_logs_${new Date().toISOString().replace(/:/g, '-')}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
          }
        });
      } catch (error) {
        statusDiv.textContent = `Error: ${error.message}`;
      }
    });
    
    // Очистка логов
    clearBtn.addEventListener('click', async function() {
      try {
        chrome.storage.local.set({ "consoleLogs": [] }, function() {
          statusDiv.textContent = 'Logs successfully cleared';
        });
      } catch (error) {
        statusDiv.textContent = `Error: ${error.message}`;
      }
    });
    
    // Проверяем количество логов при открытии
    chrome.storage.local.get("consoleLogs", function(result) {
      const logs = result.consoleLogs || [];
      updateStatus(logs.length);
    });
  });