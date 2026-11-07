"""
ai_extractor.py
Модуль "Мозг" — локальный парсинг намерений через Ollama + Qwen2.5-7B
Превращает естественный язык в строгий JSON для дальнейшей обработки.
"""

import json
import logging
from typing import Optional
import httpx

# Настройки
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5:7b"  # Отлично влезает в 12GB VRAM, понимает русский

# Системный промпт — "инструкция" для модели
SYSTEM_PROMPT = """Ты — ассистент для записи на события в библиотеке.
Твоя задача: извлечь из сообщения пользователя структурированные данные.

Извлеки следующие поля:
- service: название события/услуги (например, "Лекция по истории", "Мастер-класс")
- datetime: дата и время в формате YYYY-MM-DD HH:MM (например, "2026-11-10 15:00")
- name: имя пользователя
- phone: номер телефона в формате +7XXXXXXXXXX

Правила:
1. Если поле не указано в тексте, ставь null.
2. Если дата указана как "завтра", "послезавтра", "в пятницу" — преобразуй в конкретную дату относительно сегодня (сегодня 2026-11-05, четверг).
3. Если время указано как "вечером", "утром" — поставь примерное время (19:00, 10:00).
4. Отвечай ТОЛЬКО валидным JSON без markdown-оберток, без комментариев, без пояснений.

Пример ответа:
{"service": "Лекция по истории", "datetime": "2026-11-10 15:00", "name": "Иван", "phone": "+79991234567"}
"""

async def extract_intent(user_text: str, context: Optional[dict] = None) -> dict:
    """
    Отправляет текст пользователя в локальную модель Qwen2.5-7B
    и возвращает распарсенный JSON с извлеченными данными.
    
    Args:
        user_text: Сообщение пользователя
        context: Дополнительный контекст (например, текущая дата, список услуг)
    
    Returns:
        dict с полями service, datetime, name, phone или {"error": "..."}
    """
    # Формируем финальный промпт
    context_str = json.dumps(context, ensure_ascii=False) if context else "нет"
    full_prompt = f"{SYSTEM_PROMPT}\n\nКонтекст: {context_str}\nСообщение пользователя: {user_text}"
    
    payload = {
        "model": MODEL_NAME,
        "prompt": full_prompt,
        "stream": False,
        "format": "json",  # Заставляет модель выдавать чистый JSON
        "options": {
            "temperature": 0.1,  # Низкая температура = более предсказуемый ответ
            "num_ctx": 2048      # Размер контекста (можно увеличить до 4096, если влезет в VRAM)
        }
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(OLLAMA_URL, json=payload, timeout=30.0)
            response.raise_for_status()
            result = response.json()
        
        raw_response = result.get("response", "").strip()
        logging.info(f"Raw AI response: {raw_response}")
        
        # Очистка от возможных markdown-оберток ```json ... ```
        clean_json = raw_response
        if clean_json.startswith("```"):
            clean_json = clean_json.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        
        # Парсинг JSON
        extracted_data = json.loads(clean_json)
        
        # Валидация: проверяем, что все нужные поля есть
        required_fields = ["service", "datetime", "name", "phone"]
        for field in required_fields:
            if field not in extracted_data:
                extracted_data[field] = None
        
        return extracted_data
    
    except httpx.TimeoutException:
        logging.error("Ollama timeout")
        return {"error": "Модель думает слишком долго. Попробуйте еще раз."}
    
    except httpx.HTTPStatusError as e:
        logging.error(f"Ollama HTTP error: {e}")
        return {"error": f"Ошибка сервера Ollama: {e.response.status_code}"}
    
    except json.JSONDecodeError as e:
        logging.error(f"JSON decode error: {e}, raw: {raw_response}")
        return {"error": "Модель вернула невалидный JSON", "raw": raw_response}
    
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return {"error": f"Непредвиденная ошибка: {str(e)}"}


# === ТЕСТОВЫЙ РЕЖИМ ===
if __name__ == "__main__":
    import asyncio
    
    logging.basicConfig(level=logging.INFO)
    
    async def test():
        test_cases = [
            "Хочу записаться на лекцию по истории завтра в 15:00, меня зовут Иван, телефон +79991234567",
            "Запиши меня на мастер-класс по CSS в пятницу вечером, имя Мария, тел 89997654321",
            "Книжный клуб, 10 ноября, 18:00, Петр",
            "Привет, как дела?",  # Тест на отсутствие данных
        ]
        
        for i, text in enumerate(test_cases, 1):
            print(f"\n{'='*60}")
            print(f"Тест {i}: {text}")
            print("-" * 60)
            result = await extract_intent(text)
            print(json.dumps(result, ensure_ascii=False, indent=2))
    
    asyncio.run(test())