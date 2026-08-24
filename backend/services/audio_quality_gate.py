import re
from collections import Counter
from dataclasses import dataclass, field


@dataclass(slots=True)
class QualityAssessment:
    ok: bool
    risk_score: float
    reasons: list[str] = field(default_factory=list)
    should_retry_original: bool = False


def assess_transcription_quality(transcript_text: str) -> QualityAssessment:
    text = transcript_text.strip()
    reasons: list[str] = []
    risk_score = 0.0

    if not text:
        reasons.append("empty_transcript")
        risk_score += 1.0

    if text and len(text) < 8:
        reasons.append("too_short")
        risk_score += 0.6

    words = re.findall(r"\w+", text.lower(), flags=re.UNICODE)
    if len(words) >= 4:
        most_common_word, repeated_count = Counter(words).most_common(1)[0]
        if most_common_word and repeated_count >= max(4, len(words) // 2):
            reasons.append("degenerate_repetition")
            risk_score += 0.5

    if text:
        suspicious_chars = re.findall(r"[^0-9A-Za-zÀ-ÿ\s\.,;:!?()\[\]\"'/%-]", text)
        suspicious_ratio = len(suspicious_chars) / len(text)
        if suspicious_ratio > 0.2:
            reasons.append("suspicious_characters")
            risk_score += 0.4

    if text.count("...") >= 3:
        reasons.append("fragmented_transcript")
        risk_score += 0.3

    ok = risk_score < 0.8
    return QualityAssessment(
        ok=ok,
        risk_score=risk_score,
        reasons=reasons,
        should_retry_original=not ok,
    )