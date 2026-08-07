from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.main import app


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    testing_session = sessionmaker(bind=engine, expire_on_commit=False)

    def override_get_db() -> Generator[Session, None, None]:
        with testing_session() as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        test_client.get("/workspaces")
        yield test_client
    app.dependency_overrides.clear()


def create_item(client: TestClient, title: str, parent_id: int | None = None) -> int:
    response = client.post(
        "/items",
        json={"title": title, "kind": "task", "parent_id": parent_id},
    )
    assert response.status_code == 201
    return response.json()["id"]


def create_workspace(client: TestClient, workspace_id: str = "workspace-1") -> None:
    response = client.post(
        "/workspaces",
        json={"id": workspace_id, "name": "Рабочее пространство"},
    )
    assert response.status_code == 201


def relation_payload(
    source_id: int,
    target_id: int,
    relation_type: str = "blocks",
    workspace_id: str | None = None,
) -> dict:
    return {
        "source_id": source_id,
        "target_id": target_id,
        "type": relation_type,
        "workspace_id": workspace_id,
    }


def test_global_and_local_relation_filters(client: TestClient) -> None:
    first = create_item(client, "A")
    second = create_item(client, "B")
    third = create_item(client, "C")
    create_workspace(client)

    global_response = client.post(
        "/relations", json=relation_payload(first, second)
    )
    local_response = client.post(
        "/relations",
        json=relation_payload(second, third, "depends_on", "workspace-1"),
    )

    assert global_response.status_code == 201
    assert global_response.json()["workspace_id"] is None
    assert global_response.json()["scope"] == "global"
    assert local_response.status_code == 201
    assert local_response.json()["workspace_id"] == "workspace-1"
    assert local_response.json()["scope"] == "workspace"
    assert len(client.get("/relations?global_only=true").json()) == 1
    assert len(client.get("/relations?workspace_id=workspace-1").json()) == 2
    assert len(client.get(f"/relations?item_id={second}").json()) == 2


@pytest.mark.parametrize(
    ("payload", "detail"),
    [
        ({"source_id": 999, "target_id": 1, "type": "blocks"}, "Исходный объект не найден"),
        ({"source_id": 1, "target_id": 999, "type": "blocks"}, "Целевой объект не найден"),
    ],
)
def test_missing_relation_endpoint(
    client: TestClient, payload: dict, detail: str
) -> None:
    item_id = create_item(client, "A")
    payload = {
        **payload,
        "source_id": item_id if payload["source_id"] == 1 else payload["source_id"],
        "target_id": item_id if payload["target_id"] == 1 else payload["target_id"],
    }
    response = client.post("/relations", json=payload)
    assert response.status_code == 422
    assert response.json()["detail"] == detail


def test_relation_validation_and_duplicates(client: TestClient) -> None:
    first = create_item(client, "A")
    second = create_item(client, "B")

    self_link = client.post("/relations", json=relation_payload(first, first))
    missing_workspace = client.post(
        "/relations",
        json=relation_payload(first, second, "blocks", "missing"),
    )
    original = client.post(
        "/relations", json=relation_payload(first, second, "related_to")
    )
    duplicate = client.post(
        "/relations", json=relation_payload(second, first, "related_to")
    )

    assert self_link.status_code == 422
    assert missing_workspace.status_code == 422
    assert original.status_code == 201
    assert duplicate.status_code == 409


def test_delete_relation(client: TestClient) -> None:
    first = create_item(client, "A")
    second = create_item(client, "B")
    relation = client.post(
        "/relations", json=relation_payload(first, second)
    ).json()

    assert client.delete(f"/relations/{relation['id']}").status_code == 204
    assert client.get("/relations").json() == []


def test_item_and_workspace_deletion_clean_relations(client: TestClient) -> None:
    first = create_item(client, "A")
    second = create_item(client, "B")
    third = create_item(client, "C")
    create_workspace(client)
    client.post("/relations", json=relation_payload(first, second))
    client.post(
        "/relations",
        json=relation_payload(first, third, "blocks", "workspace-1"),
    )

    assert client.delete(f"/items/{second}").status_code == 204
    assert len(client.get("/relations").json()) == 1
    assert client.delete("/workspaces/workspace-1").status_code == 204
    assert client.get("/relations").json() == []


def test_parent_of_rejects_cycles_with_canonical_hierarchy(client: TestClient) -> None:
    root = create_item(client, "Root")
    child = create_item(client, "Child", root)
    grandchild = create_item(client, "Grandchild", child)

    response = client.post(
        "/relations",
        json=relation_payload(grandchild, root, "parent_of"),
    )
    assert response.status_code == 422


def test_parent_of_rejects_existing_canonical_edge(client: TestClient) -> None:
    root = create_item(client, "Root")
    child = create_item(client, "Child", root)

    response = client.post(
        "/relations",
        json=relation_payload(root, child, "parent_of"),
    )
    assert response.status_code == 409


def test_parent_of_rejects_composite_global_cycle(client: TestClient) -> None:
    first = create_item(client, "A")
    second = create_item(client, "B")
    third = create_item(client, "C")
    assert client.post(
        "/relations", json=relation_payload(first, second, "parent_of")
    ).status_code == 201
    assert client.post(
        "/relations", json=relation_payload(second, third, "parent_of")
    ).status_code == 201

    response = client.post(
        "/relations", json=relation_payload(third, first, "parent_of")
    )
    assert response.status_code == 422


def test_local_parent_cycle_is_isolated_to_workspace(client: TestClient) -> None:
    first = create_item(client, "A")
    second = create_item(client, "B")
    create_workspace(client, "workspace-1")
    create_workspace(client, "workspace-2")
    assert client.post(
        "/relations",
        json=relation_payload(first, second, "parent_of", "workspace-1"),
    ).status_code == 201

    cycle = client.post(
        "/relations",
        json=relation_payload(second, first, "parent_of", "workspace-1"),
    )
    other_workspace = client.post(
        "/relations",
        json=relation_payload(second, first, "parent_of", "workspace-2"),
    )
    assert cycle.status_code == 422
    assert other_workspace.status_code == 201


def test_global_parent_cannot_break_existing_local_projection(
    client: TestClient,
) -> None:
    first = create_item(client, "A")
    second = create_item(client, "B")
    create_workspace(client)
    assert client.post(
        "/relations",
        json=relation_payload(first, second, "parent_of", "workspace-1"),
    ).status_code == 201

    response = client.post(
        "/relations", json=relation_payload(second, first, "parent_of")
    )
    assert response.status_code == 422


@pytest.mark.parametrize("relation_type", ["blocks", "depends_on", "related_to"])
def test_semantic_relations_allow_graph_cycles(
    client: TestClient, relation_type: str
) -> None:
    first = create_item(client, "A")
    second = create_item(client, "B")
    assert client.post(
        "/relations", json=relation_payload(first, second, relation_type)
    ).status_code == 201
    reverse = client.post(
        "/relations", json=relation_payload(second, first, relation_type)
    )
    if relation_type == "related_to":
        assert reverse.status_code == 409
    else:
        assert reverse.status_code == 201
