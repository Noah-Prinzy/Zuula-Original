"""SMS and email are both fire-and-forget log stubs — the only contract worth testing is
"doesn't raise," since there's nothing to observe from the caller's side without inspecting
logs.
"""

from app.adapters.email import get_email_sender
from app.adapters.sms import get_sms_sender


def test_sms_send_does_not_raise():
    get_sms_sender().send(to="+256700000000", message="test")


def test_email_send_does_not_raise():
    get_email_sender().send(to="a@b.com", subject="Test", body="body")
