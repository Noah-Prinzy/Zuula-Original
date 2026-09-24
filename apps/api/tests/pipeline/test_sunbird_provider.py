"""SunbirdLanguageProvider against respx mocks of Sunbird's documented API
(POST /tasks/language_id, POST /tasks/nllb_translate). Nothing calls the real service."""

import json

import httpx
import pytest
import respx

from app.providers.language import OTHER, SunbirdError, SunbirdLanguageProvider

URL = "https://sunbird.example"
sunbird = SunbirdLanguageProvider(api_url=URL, api_key="test-key")


def _translated(text: str) -> httpx.Response:
    return httpx.Response(
        200,
        json={
            "id": "job",
            "status": "success",
            "output": {"text": "…", "translated_text": text, "Error": None},
        },
    )


@respx.mock
@pytest.mark.parametrize(("sunbird_code", "ours"), [("lug", "lg"), ("eng", "en"), ("teo", "teo"), ("lgg", OTHER)])
async def test_detect_maps_sunbird_codes(sunbird_code, ours):
    route = respx.post(f"{URL}/tasks/language_id").mock(return_value=httpx.Response(200, json={"language": sunbird_code}))
    result = await sunbird.detect(text="Muli mutya bannange?")
    assert result.language == ours
    # Sunbird reports neither a confidence nor code-switching.
    assert result.confidence is None and result.also_contains == []
    request = route.calls.last.request
    assert request.headers["Authorization"] == "Bearer test-key"
    assert json.loads(request.content) == {"text": "Muli mutya bannange?"}


@respx.mock
async def test_detect_accepts_the_answer_nested_under_output():
    respx.post(f"{URL}/tasks/language_id").mock(return_value=httpx.Response(200, json={"output": {"language": "nyn"}}))
    assert (await sunbird.detect(text="x")).language == "nyn"


async def test_detect_empty_text_without_a_call():
    assert (await sunbird.detect(text="  ")).language == OTHER


@respx.mock
async def test_translate_uses_sunbird_codes():
    route = respx.post(f"{URL}/tasks/nllb_translate").mock(return_value=_translated("How are you?"))
    result = await sunbird.translate(text="Oli otya?", source="lg", target="en")
    assert (result.text, result.translated) == ("How are you?", True)
    assert json.loads(route.calls.last.request.content) == {
        "source_language": "lug",
        "target_language": "eng",
        "text": "Oli otya?",
    }


@respx.mock
async def test_long_text_is_translated_in_sentence_chunks():
    route = respx.post(f"{URL}/tasks/nllb_translate").mock(
        side_effect=lambda request: _translated(f"[{len(json.loads(request.content)['text'])}]")
    )
    sentence = "Ekigambo kino kyali kya bulimba. " * 40  # ~1,300 characters
    result = await sunbird.translate(text=sentence, source="lg", target="en")
    assert route.call_count == 2
    assert all(len(json.loads(c.request.content)["text"]) <= 1000 for c in route.calls)
    assert result.text.count("[") == 2


async def test_same_language_passes_through_without_a_call():
    result = await sunbird.translate(text="Unchanged.", source="en", target="en")
    assert (result.text, result.translated) == ("Unchanged.", False)


@respx.mock
@pytest.mark.parametrize(
    "response",
    [
        httpx.Response(401, json={"detail": "Invalid token"}),
        httpx.Response(200, json={"output": {"translated_text": None, "Error": "model busy"}}),
        httpx.Response(200, text="not json"),
    ],
)
async def test_failures_raise(response):
    respx.post(f"{URL}/tasks/nllb_translate").mock(return_value=response)
    with pytest.raises(SunbirdError):
        await sunbird.translate(text="Oli otya?", source="lg", target="en")


async def test_unsupported_languages_are_refused():
    with pytest.raises(ValueError):
        await sunbird.translate(text="x", source=OTHER, target="en")
