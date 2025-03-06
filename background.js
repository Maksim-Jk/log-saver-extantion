// background.js - фоновый скрипт для расширения
console.log("[EXT_DEBUG] Расширение загружено!"); 

// Отправляем сообщение об активации расширения
chrome.runtime.onInstalled.addListener(() => {
  console.log("[EXT_DEBUG] Расширение установлено/обновлено");
});

// Больше не нужно инжектировать скрипт через tabs.onUpdated,
// так как мы используем content_scripts в manifest.json