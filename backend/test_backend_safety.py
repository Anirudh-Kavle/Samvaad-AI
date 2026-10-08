import os
import uuid
from unittest.mock import patch

import pytest
from pydantic import ValidationError

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("GROQ_API_KEY", "test-key")

from api import app, verify_access
from council_chamber_manager import CouncilChamberManager
from models import DebateSetupRequest


def test_debate_input_limits():
    with pytest.raises(ValidationError):
        DebateSetupRequest(
            groq_api_key="key",
            character_names=["one"] * 7,
            topic="topic",
        )


def test_status_and_stop_require_session_access():
    for path in ("/debates/{session_id}/status/", "/debates/{session_id}/"):
        route = next(route for route in app.routes if route.path == path)
        assert any(dependency.call is verify_access for dependency in route.dependant.dependencies)


def test_failed_message_write_is_retried():
    manager = object.__new__(CouncilChamberManager)
    manager.session_id = uuid.uuid4()
    manager.last_persisted_index = 0
    manager._display_names = {}
    manager.get_chat_history = lambda: [
        {"name": "A", "content": "first"},
        {"name": "B", "content": "second"},
    ]
    manager._extract_sender = lambda message: message["name"]
    manager._extract_content = lambda message: message["content"]

    class Database:
        rolled_back = False

        def rollback(self):
            self.rolled_back = True

        def close(self):
            pass

    database = Database()
    with patch("council_chamber_manager.SessionLocal", return_value=database), patch(
        "council_chamber_manager.save_chat_message",
        side_effect=[None, RuntimeError("database unavailable")],
    ):
        manager.persist_new_messages()

    assert manager.last_persisted_index == 1
    assert database.rolled_back
