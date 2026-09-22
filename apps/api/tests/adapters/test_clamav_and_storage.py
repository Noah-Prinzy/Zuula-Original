from app.adapters.clamav import get_clamav_scanner
from app.adapters.storage import get_object_storage


def test_clamav_stub_always_clean():
    result = get_clamav_scanner().scan(b"anything")
    assert result.clean is True
    assert result.signature is None


def test_storage_stub_returns_a_url_for_the_key():
    url = get_object_storage().put(key="ZL-TEST-01/media", data=b"", content_type="image/jpeg")
    assert url.startswith("https://")
    assert "ZL-TEST-01/media" in url
