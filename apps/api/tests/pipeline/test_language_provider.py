import pytest

from app.providers import language
from app.providers.language import (
    OTHER,
    PIVOT_LANGUAGE,
    SUPPORTED_LANGUAGES,
    StubLanguageProvider,
    display_name,
    get_language_provider,
    resolve_submission_language,
)

# One fixture per supported language, each built from that language's stub markers. These
# test the stub's heuristic, not whether the sentences are good Luganda/Acholi/etc.
FIXTURES = {
    "en": "The minister said that fuel prices will double and this is the plan.",
    "lg": "Gavumenti egamba nti ssente zijja kweyongera, naye era abantu beewuunya.",
    "ach": "Lok man tye ki dano pa gavmen ento pien gin pe gutye.",
    "nyn": "Mbwenu kandi okuruga reero ebeyi nizija kweyongyera ahabwokuba.",
    "teo": "Eong arai itunga ijo kere ebe kotoma.",
}


@pytest.mark.parametrize(("code", "text"), FIXTURES.items())
def test_stub_detects_each_supported_language(code, text):
    result = StubLanguageProvider().detect(text=text)
    assert result.language == code
    assert 0.0 < result.confidence <= 1.0
    assert code not in result.also_contains


def test_fixtures_cover_every_supported_language():
    assert set(FIXTURES) == set(SUPPORTED_LANGUAGES)


def test_stub_detection_is_deterministic():
    provider = StubLanguageProvider()
    assert provider.detect(text=FIXTURES["lg"]) == provider.detect(text=FIXTURES["lg"])


def test_stub_detection_is_case_insensitive():
    provider = StubLanguageProvider()
    assert provider.detect(text=FIXTURES["teo"].upper()).language == "teo"


def test_stub_returns_other_when_nothing_matches():
    result = StubLanguageProvider().detect(text="Bonjour tout le monde 123")
    assert result.language == OTHER
    assert result.confidence == 0.0
    assert result.also_contains == []


def test_stub_returns_other_for_empty_text():
    assert StubLanguageProvider().detect(text="").language == OTHER


def test_stub_reports_code_switching():
    # Mostly Luganda, with some English mixed in.
    text = "Gavumenti egamba nti ssente zijja, naye era the minister is wrong."
    result = StubLanguageProvider().detect(text=text)
    assert result.language == "lg"
    assert result.also_contains == ["en"]
    assert result.confidence < 1.0


def test_stub_ties_go_to_the_earlier_language():
    # One English marker, one Luganda marker: English comes first in SUPPORTED_LANGUAGES.
    result = StubLanguageProvider().detect(text="the nti")
    assert result.language == "en"
    assert result.also_contains == ["lg"]


def test_stub_translation_to_pivot_is_clearly_marked():
    result = StubLanguageProvider().translate(
        text=FIXTURES["lg"], source="lg", target=PIVOT_LANGUAGE
    )
    assert result.translated is True
    assert result.text.startswith("[stub-translation lg->en] ")
    assert result.text.endswith(FIXTURES["lg"])
    assert (result.source, result.target) == ("lg", "en")


def test_stub_translation_back_to_submission_language():
    result = StubLanguageProvider().translate(
        text="This claim is false.", source=PIVOT_LANGUAGE, target="ach"
    )
    assert result.translated is True
    assert result.text == "[stub-translation en->ach] This claim is false."


def test_stub_translation_same_language_passes_through():
    result = StubLanguageProvider().translate(text="Unchanged.", source="en", target="en")
    assert result.translated is False
    assert result.text == "Unchanged."


@pytest.mark.parametrize(("source", "target"), [(OTHER, "en"), ("en", OTHER), ("fr", "en")])
def test_stub_translation_rejects_unsupported_languages(source, target):
    with pytest.raises(ValueError):
        StubLanguageProvider().translate(text="x", source=source, target=target)


def test_resolve_trusts_an_explicit_language_choice():
    # Luganda text, but the submitter said Ateso: their choice wins and detection is skipped.
    assert resolve_submission_language("teo", FIXTURES["lg"], StubLanguageProvider()) == "teo"


def test_resolve_detects_when_auto():
    assert resolve_submission_language("auto", FIXTURES["nyn"], StubLanguageProvider()) == "nyn"


def test_resolve_can_return_other():
    assert resolve_submission_language("auto", "Bonjour", StubLanguageProvider()) == OTHER


def test_display_names():
    assert display_name("lg") == "Luganda"
    assert display_name(OTHER) == "Other"


def test_get_language_provider_returns_stub_by_default():
    assert isinstance(get_language_provider(), StubLanguageProvider)


def test_unknown_provider_raises(monkeypatch):
    monkeypatch.setenv("LANGUAGE_PROVIDER", "sunbird")
    language.get_language_settings.cache_clear()
    try:
        with pytest.raises(NotImplementedError):
            get_language_provider()
    finally:
        monkeypatch.delenv("LANGUAGE_PROVIDER", raising=False)
        language.get_language_settings.cache_clear()


def test_sunbird_settings_read_from_env(monkeypatch):
    monkeypatch.setenv("SUNBIRD_API_URL", "https://sunbird.example")
    monkeypatch.setenv("SUNBIRD_API_KEY", "test-key")
    language.get_language_settings.cache_clear()
    try:
        settings = language.get_language_settings()
        assert settings.sunbird_api_url == "https://sunbird.example"
        assert settings.sunbird_api_key == "test-key"
    finally:
        monkeypatch.delenv("SUNBIRD_API_URL", raising=False)
        monkeypatch.delenv("SUNBIRD_API_KEY", raising=False)
        language.get_language_settings.cache_clear()
