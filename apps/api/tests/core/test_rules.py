"""Pins the values in app/core/rules.py against the P2 brief's Step 5 list and the internal
consistency between ESCALATION_RATING_THRESHOLD and CCS_STATUS_THRESHOLDS — a regression
here means either the module or a caller drifted from the documented business rule.
"""

from app.core import rules


def test_ccs_weights_match_the_brief():
    assert rules.CCS_WEIGHTS == {"public": 1, "journalist": 2, "expert": 5}


def test_escalation_threshold_is_derived_from_the_status_thresholds():
    escalated = rules.CCS_STATUS_THRESHOLDS["escalated"]
    assert escalated["min_ratings"] == rules.ESCALATION_RATING_THRESHOLD
    assert rules.ESCALATION_RATING_THRESHOLD == 100


def test_review_sla_hours():
    assert rules.REVIEW_SLA_HOURS == 48


def test_password_min_length():
    assert rules.PASSWORD_MIN_LENGTH == 12


def test_max_media_bytes():
    assert rules.MAX_MEDIA_BYTES == 50 * 1024 * 1024


def test_partner_rate_limit():
    assert rules.PARTNER_RATE_LIMIT_PER_HOUR == 100


def test_settings_default_rate_limit_matches_rules():
    from app.core.config import Settings

    default = Settings.model_fields["partner_rate_limit_per_hour"].default
    assert default == rules.PARTNER_RATE_LIMIT_PER_HOUR


def test_scoring_stub_uses_rules_values():
    from app.stubs import scoring

    assert scoring.CCS_WEIGHTS is rules.CCS_WEIGHTS
    assert scoring.CCS_STATUS_THRESHOLDS is rules.CCS_STATUS_THRESHOLDS


def test_review_stub_uses_rules_sla():
    from app.stubs import review

    assert review.REVIEW_SLA_HOURS is rules.REVIEW_SLA_HOURS


def test_admin_default_settings_reflect_rules():
    from app.stubs.admin import DEFAULT_SETTINGS

    assert DEFAULT_SETTINGS.sla_hours == rules.REVIEW_SLA_HOURS
    assert DEFAULT_SETTINGS.api_rate_limit == rules.PARTNER_RATE_LIMIT_PER_HOUR
    assert DEFAULT_SETTINGS.weights.expert == rules.CCS_WEIGHTS["expert"]
    assert DEFAULT_SETTINGS.thresholds.escalated_ratings == rules.ESCALATION_RATING_THRESHOLD
