from difflib import SequenceMatcher

def compare_landlord_data(extracted_data: dict, landlord) -> dict:
    """Compare Textract extracted data against landlord registration info."""

    # Map possible Textract field names -> landlord attributes
    field_mappings = {
        "first_name": [
            "first name", "first_name", "given name", "given_name",
            "prenom", "name", "first",
        ],
        "last_name": [
            "last name", "last_name", "surname", "family name",
            "family_name", "last",
        ],
        "phone": [
            "phone", "phone number", "telephone", "mobile",
            "contact number", "tel",
        ],
    }

    results = {}

    for landlord_field, possible_keys in field_mappings.items():
        landlord_value = getattr(landlord, landlord_field, "").strip().lower()
        extracted_value = None

        # Find matching key in extracted data
        for key in possible_keys:
            if key in extracted_data:
                extracted_value = extracted_data[key].strip().lower()
                break

        if extracted_value is None:
            results[landlord_field] = {
                "status": "not_found",
                "landlord_value": landlord_value,
                "extracted_value": None,
                "confidence": 0.0,
            }
        else:
            similarity = SequenceMatcher(None, landlord_value, extracted_value).ratio()
            results[landlord_field] = {
                "status": "match" if similarity >= 0.85 else "mismatch",
                "landlord_value": landlord_value,
                "extracted_value": extracted_value,
                "confidence": round(similarity, 2),
            }

    # Overall verdict
    statuses = [r["status"] for r in results.values()]
    if all(s == "match" for s in statuses):
        overall = "verified"
    elif "mismatch" in statuses:
        overall = "failed"
    else:
        overall = "needs_review"

    return {
        "overall_status": overall,
        "field_results": results,
    }