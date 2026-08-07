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

export async function updateItemStatus(itemId, status) {
  const response = await fetch(`${API_BASE_URL}/items/${itemId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(
      `Не удалось обновить задачу. Код ответа: ${response.status}`,
    );
  }

  return response.json();
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) {
    let message = `Ошибка запроса (${response.status})`;
    try { message = (await response.json()).detail ?? message; } catch { /* empty */ }
    throw new Error(message);
  }
  return response.status === 204 ? null : response.json();
}

export const createItem = (data) => request("/items", { method: "POST", body: JSON.stringify(data) });
export const updateItem = (id, data) => request(`/items/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteItem = (id) => request(`/items/${id}`, { method: "DELETE" });

export const fetchWorkspaces = () => request("/workspaces");
export const createWorkspaceRecord = (data) => request("/workspaces", {
  method: "POST",
  body: JSON.stringify(data),
});
export const fetchRelations = () => request("/relations");
export const createRelation = (data) => request("/relations", {
  method: "POST",
  body: JSON.stringify(data),
});
export const deleteRelation = (id) => request(`/relations/${id}`, {
  method: "DELETE",
});
