"""Transliterated from apps/web/lib/mock/fact-checks.ts and quick-reports.ts. Fictional
claims, articles and people for API development only — same rule as the frontend's own
comment: source URLs point to outlet home pages, not real articles."""

from app.schemas.fact_check import (
    AISignal,
    Citation,
    Claim,
    CommunityRating,
    ExpertAnnotation,
    FactCheckReport,
    HumanReview,
    RatingComment,
    RatingCounts,
)
from app.stubs.scoring import community_score

_TEXT_1 = (
    "BREAKING: The Ministry of ICT has announced that every Ugandan will get free unlimited "
    "internet from January 2027. All you need to do is register your National ID number on the "
    "link below before Friday. The programme is fully funded by the World Bank and has already "
    "been approved by Parliament. Share this with everyone in your family!"
)


def _span(text: str, phrase: str) -> tuple[int, int]:
    start = text.index(phrase)
    return start, start + len(phrase)


def _community(accurate: dict, inaccurate: dict, comments: list[RatingComment]) -> CommunityRating:
    acc = RatingCounts(**accurate)
    inacc = RatingCounts(**inaccurate)
    return CommunityRating(accurate=acc, inaccurate=inacc, comments=comments, score=community_score(acc, inacc))


_c1_start, _c1_end = _span(_TEXT_1, "every Ugandan will get free unlimited internet from January 2027")
_c2_start, _c2_end = _span(_TEXT_1, "register your National ID number on the link below")
_c3_start, _c3_end = _span(
    _TEXT_1, "fully funded by the World Bank and has already been approved by Parliament"
)

DETAILED_REPORTS: list[FactCheckReport] = [
    FactCheckReport(
        id="fc-2026-0142",
        tracking_id="ZL-7K3P-Q9",
        title="“Free unlimited internet for every Ugandan from January 2027”",
        content_type="text",
        language="English",
        submitted_text=_TEXT_1,
        verdict="false",
        confidence=92,
        summary=(
            "No free national internet programme has been announced. The message matches a "
            "known phishing pattern that asks people to submit their National ID number "
            "through an unofficial link."
        ),
        what_is_false=[
            "There is no announcement of free unlimited internet for all citizens from "
            "January 2027.",
            "There is no World Bank-funded programme of this kind approved by Parliament.",
        ],
        what_is_true=[
            "The government runs a separate programme expanding public Wi-Fi in selected towns.",
            "Official registration never asks for your National ID number through a shared link.",
        ],
        claims=[
            Claim(
                id="c1",
                start=_c1_start,
                end=_c1_end,
                assessment="false",
                reason="No official statement or policy document announces free unlimited internet for all citizens.",
                citation_ids=["s1", "s2"],
            ),
            Claim(
                id="c2",
                start=_c2_start,
                end=_c2_end,
                assessment="misleading",
                reason="Government services do not collect ID numbers through forwarded links. This matches a common phishing pattern.",
                citation_ids=["s3"],
            ),
            Claim(
                id="c3",
                start=_c3_start,
                end=_c3_end,
                assessment="unsupported",
                reason="No funding agreement or parliamentary record supports this claim.",
                citation_ids=["s4"],
            ),
        ],
        citations=[
            Citation(
                id="s1",
                source_name="Ministry of ICT (sample)",
                title="Statement on public Wi-Fi expansion (sample)",
                url="https://ict.go.ug",
                published_at="2026-09-12",
                stance="contradicts",
                trusted=True,
                excerpt="The programme covers public Wi-Fi hotspots in selected municipalities.",
            ),
            Citation(
                id="s2",
                source_name="Daily Monitor (sample)",
                title="What the public Wi-Fi rollout does and does not include (sample)",
                url="https://www.monitor.co.ug",
                published_at="2026-09-14",
                stance="contradicts",
                trusted=True,
            ),
            Citation(
                id="s3",
                source_name="Uganda Communications Commission (sample)",
                title="Consumer alert: messages asking for ID numbers (sample)",
                url="https://www.ucc.co.ug",
                published_at="2026-08-30",
                stance="contradicts",
                trusted=True,
            ),
            Citation(
                id="s4",
                source_name="Parliament of Uganda (sample)",
                title="Order paper, September 2026 (sample)",
                url="https://www.parliament.go.ug",
                published_at="2026-09-10",
                stance="context",
                trusted=True,
            ),
        ],
        ai_signals=[
            AISignal(
                id="a1",
                label="Perplexity score",
                description="How predictable the wording is to a language model. Very predictable text is more likely machine-written.",
                score=0.34,
                threshold=0.7,
                method="Perplexity + RoBERTa classifier",
            ),
            AISignal(
                id="a2",
                label="Template similarity",
                description="Similarity to known viral hoax templates in the Zuula corpus.",
                score=0.88,
                threshold=0.75,
                method="Vector similarity search",
            ),
        ],
        annotations=[
            ExpertAnnotation(
                id="e1",
                author="David Okello",
                role="Expert Reviewer",
                created_at="2026-09-19T00:00:00+03:00",
                body="Confirmed with the Ministry's communications office. Variants of this message are circulating on WhatsApp in Luganda and English.",
            )
        ],
        human_review=HumanReview(
            outcome="confirmed",
            reviewer="David Okello",
            reviewed_at="2026-09-19T00:00:00+03:00",
            justification="Verified with the Ministry. No such programme exists.",
        ),
        community=_community(
            {"public": 180, "journalist": 12, "expert": 3},
            {"public": 11, "journalist": 0, "expert": 0},
            [
                RatingComment(
                    id="r1",
                    author="Grace Nankya",
                    role="journalist",
                    vote="accurate",
                    body="Our newsroom contacted the Ministry and got the same answer. No such programme.",
                    created_at="2026-09-19T00:00:00+03:00",
                ),
                RatingComment(
                    id="r2",
                    author="Peter Wabwire",
                    role="public",
                    vote="accurate",
                    body="I received this in three WhatsApp groups. The link asked for my NIN and phone PIN.",
                    created_at="2026-09-19T00:00:00+03:00",
                ),
                RatingComment(
                    id="r3",
                    author="James Ssentongo",
                    role="public",
                    vote="inaccurate",
                    body="There is a public Wi-Fi project, so part of it may be true.",
                    created_at="2026-09-20T00:00:00+03:00",
                ),
            ],
        ),
        category="Technology",
        checked_at="2026-09-18T00:00:00+03:00",
        processing_seconds=6.4,
    ),
    FactCheckReport(
        id="fc-2026-0157",
        tracking_id="ZL-2M8D-R4",
        title="Photo of flooded Kampala road shared as “today”",
        content_type="image",
        language="English",
        submitted_text="Kampala-Entebbe Expressway completely underwater this morning. Avoid the route!",
        verdict="ai-generated",
        confidence=87,
        summary=(
            "The image shows strong signs of AI generation: inconsistent lighting, distorted "
            "road signs and no camera metadata. No reports of flooding on the route match the "
            "claimed date."
        ),
        what_is_false=["The photo was not taken on the expressway on the claimed date."],
        what_is_true=[
            "Heavy rain was reported in parts of Kampala that week, without closures on the expressway."
        ],
        claims=[],
        citations=[
            Citation(
                id="s1",
                source_name="Uganda National Roads Authority (sample)",
                title="Road status update (sample)",
                url="https://www.unra.go.ug",
                published_at="2026-09-20",
                stance="contradicts",
                trusted=True,
            ),
            Citation(
                id="s2",
                source_name="Uganda National Meteorological Authority (sample)",
                title="Weekly weather summary (sample)",
                url="https://www.unma.go.ug",
                published_at="2026-09-19",
                stance="context",
                trusted=True,
            ),
            Citation(
                id="s3",
                source_name="Nile Post (sample)",
                title="No closures reported on major routes (sample)",
                url="https://nilepost.co.ug",
                published_at="2026-09-20",
                stance="contradicts",
                trusted=True,
            ),
        ],
        ai_signals=[
            AISignal(
                id="a1",
                label="Deepfake image classifier",
                description="Probability that the image was generated or heavily edited by an AI model.",
                score=0.91,
                threshold=0.7,
                method="CNNDetection model",
            ),
            AISignal(
                id="a2",
                label="Metadata anomalies",
                description="The file has no camera EXIF data and an editing-software signature.",
                score=0.82,
                threshold=0.6,
                method="EXIF analysis",
            ),
            AISignal(
                id="a3",
                label="Reverse image match",
                description="Similar images found online before the claimed date.",
                score=0.41,
                threshold=0.6,
                method="Perceptual hash search",
            ),
        ],
        annotations=[],
        community=_community(
            {"public": 30, "journalist": 2, "expert": 0},
            {"public": 24, "journalist": 1, "expert": 0},
            [
                RatingComment(
                    id="r1",
                    author="Esther Atim",
                    role="public",
                    vote="inaccurate",
                    body="I drove past that section this morning and parts of it were flooded.",
                    created_at="2026-09-20T00:00:00+03:00",
                ),
                RatingComment(
                    id="r2",
                    author="Sarah Namutebi",
                    role="journalist",
                    vote="accurate",
                    body="The road signs in the photo don't match the expressway's signage.",
                    created_at="2026-09-20T00:00:00+03:00",
                ),
            ],
        ),
        category="Weather",
        checked_at="2026-09-20T00:00:00+03:00",
        processing_seconds=38.2,
    ),
]


def _quick(
    *,
    id: str,
    title: str,
    content_type: str,
    language: str,
    text: str,
    verdict: str,
    confidence: int,
    summary: str,
    category: str,
    checked_at: str,
    source_name: str,
    source_url: str,
    accurate: tuple[int, int, int],
    inaccurate: tuple[int, int, int],
    stance: str | None = None,
    what_is_false: list[str] | None = None,
    what_is_true: list[str] | None = None,
) -> FactCheckReport:
    n = id[-4:]
    tracking_id = f"ZL-{n.replace('0', '7').replace('1', '7')}-QK"
    default_stance = stance or ("supports" if verdict == "authentic" else "contradicts")
    return FactCheckReport(
        id=id,
        tracking_id=tracking_id,
        title=title,
        content_type=content_type,
        language=language,
        submitted_text=text,
        verdict=verdict,
        confidence=confidence,
        summary=summary,
        what_is_false=what_is_false or [],
        what_is_true=what_is_true or [],
        claims=[],
        citations=[
            Citation(
                id="s1",
                source_name=f"{source_name} (sample)",
                title="Related official information (sample)",
                url=source_url,
                published_at=checked_at,
                stance=default_stance,
                trusted=True,
            )
        ],
        ai_signals=[],
        annotations=[],
        community=_community(
            {"public": accurate[0], "journalist": accurate[1], "expert": accurate[2]},
            {"public": inaccurate[0], "journalist": inaccurate[1], "expert": inaccurate[2]},
            [],
        ),
        category=category,
        checked_at=f"{checked_at}T00:00:00+03:00",
        processing_seconds=7.1 if content_type in ("text", "url") else 41.5,
    )


QUICK_REPORTS: list[FactCheckReport] = [
    _quick(
        id="fc-2026-0161",
        title="“Boiled banana leaves cure malaria in three days”",
        content_type="text",
        language="Luganda",
        text="Sample WhatsApp message in Luganda claiming a home remedy cures malaria.",
        verdict="false",
        confidence=95,
        summary="No evidence supports this remedy. Health authorities advise testing and approved treatment for malaria.",
        category="Health",
        checked_at="2026-09-21",
        source_name="Ministry of Health",
        source_url="https://www.health.go.ug",
        accurate=(312, 20, 4),
        inaccurate=(9, 0, 0),
        what_is_false=["Banana leaves do not cure malaria."],
        what_is_true=["Malaria is treatable with approved medicine after a test."],
    ),
    _quick(
        id="fc-2026-0160",
        title="Video of a “new 50,000 shilling note” entering circulation",
        content_type="video",
        language="English",
        text="Short video showing a banknote design said to be released next month.",
        verdict="ai-generated",
        confidence=83,
        summary="The note in the video was digitally created. No new denomination has been announced.",
        category="Economy",
        checked_at="2026-09-21",
        source_name="Bank of Uganda",
        source_url="https://www.bou.or.ug",
        accurate=(140, 6, 1),
        inaccurate=(22, 1, 0),
    ),
    _quick(
        id="fc-2026-0159",
        title="“All schools to close for the rest of the term next week”",
        content_type="text",
        language="English",
        text="Message claiming the Ministry has ordered all schools to close early.",
        verdict="likely-false",
        confidence=74,
        summary="No closure order was issued. The message appears to mix an old circular with a new date.",
        category="Education",
        checked_at="2026-09-20",
        source_name="Ministry of Education and Sports",
        source_url="https://www.education.go.ug",
        accurate=(48, 3, 0),
        inaccurate=(41, 2, 0),
    ),
    _quick(
        id="fc-2026-0158",
        title="Voice note on fuel prices doubling from October",
        content_type="audio",
        language="Runyankole",
        text="Voice note in Runyankole saying fuel prices will double next month.",
        verdict="unverifiable",
        confidence=58,
        summary="We found no official announcement either way. Treat specific price forecasts with caution.",
        category="Economy",
        checked_at="2026-09-20",
        source_name="Ministry of Energy and Mineral Development",
        source_url="https://www.energyandminerals.go.ug",
        stance="context",
        accurate=(36, 1, 0),
        inaccurate=(30, 2, 0),
    ),
    _quick(
        id="fc-2026-0156",
        title="New national examination timetable published",
        content_type="url",
        language="English",
        text="https://example.org/sample-timetable",
        verdict="authentic",
        confidence=91,
        summary="The timetable matches the version published by the examinations board.",
        category="Education",
        checked_at="2026-09-19",
        source_name="UNEB",
        source_url="https://uneb.ac.ug",
        accurate=(120, 8, 2),
        inaccurate=(6, 0, 0),
    ),
    _quick(
        id="fc-2026-0155",
        title="“Voting will move to mobile phones at the next election”",
        content_type="text",
        language="Acholi",
        text="Message in Acholi claiming voting will be done by phone.",
        verdict="false",
        confidence=88,
        summary="Voting remains in person. The electoral body has made no such change.",
        category="Elections",
        checked_at="2026-09-18",
        source_name="Electoral Commission",
        source_url="https://www.ec.or.ug",
        accurate=(36, 1, 0),
        inaccurate=(98, 6, 1),
    ),
    _quick(
        id="fc-2026-0154",
        title="Photo of record water levels at a lakeside landing site",
        content_type="image",
        language="English",
        text="Photo said to show this week's water levels.",
        verdict="likely-false",
        confidence=69,
        summary="The photo is real but from 2020. Current levels are lower.",
        category="Weather",
        checked_at="2026-09-17",
        source_name="Ministry of Water and Environment",
        source_url="https://www.mwe.go.ug",
        accurate=(55, 4, 1),
        inaccurate=(12, 0, 0),
    ),
    _quick(
        id="fc-2026-0153",
        title="Free mobile data offer circulating on social media",
        content_type="url",
        language="English",
        text="https://example.org/sample-offer",
        verdict="false",
        confidence=97,
        summary="The link is a phishing page imitating a telecom operator.",
        category="Technology",
        checked_at="2026-09-16",
        source_name="Uganda Communications Commission",
        source_url="https://www.ucc.co.ug",
        accurate=(402, 15, 3),
        inaccurate=(4, 0, 0),
    ),
    _quick(
        id="fc-2026-0152",
        title="Speech clip attributed to a district official",
        content_type="video",
        language="Ateso",
        text="Clip of a speech in Ateso shared with a misleading caption.",
        verdict="ai-generated",
        confidence=79,
        summary="The voice track shows signs of synthesis and does not match the original recording.",
        category="Politics",
        checked_at="2026-09-15",
        source_name="Uganda Radio Network",
        source_url="https://ugandaradionetwork.net",
        accurate=(18, 0, 0),
        inaccurate=(196, 10, 1),
    ),
    _quick(
        id="fc-2026-0151",
        title="Cholera vaccination campaign announced for border districts",
        content_type="text",
        language="English",
        text="Message announcing a vaccination campaign and its dates.",
        verdict="authentic",
        confidence=93,
        summary="The campaign and dates match the official announcement.",
        category="Health",
        checked_at="2026-09-14",
        source_name="Ministry of Health",
        source_url="https://www.health.go.ug",
        accurate=(88, 5, 2),
        inaccurate=(7, 0, 0),
    ),
]

SAMPLE_REPORTS: list[FactCheckReport] = sorted(
    [*DETAILED_REPORTS, *QUICK_REPORTS], key=lambda r: r.checked_at, reverse=True
)

_BY_ID = {r.id: r for r in SAMPLE_REPORTS}
_BY_TRACKING_ID = {r.tracking_id: r for r in SAMPLE_REPORTS}


def get_report(report_id: str) -> FactCheckReport | None:
    return _BY_ID.get(report_id)


def get_report_by_tracking_id(tracking_id: str) -> FactCheckReport | None:
    return _BY_TRACKING_ID.get(tracking_id)
