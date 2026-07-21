const API_BASE_URL = "http://127.0.0.1:8000";

export async function fetchItemTree() {
  const response = await fetch(`${API_BASE_URL}/items/tree`);

  if (!response.ok) {
    throw new Error(
      `Не удалось загрузить дерево. Код ответа: ${response.status}`,
    );
  }

  return response.json();
}