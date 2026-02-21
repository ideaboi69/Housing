# --- utils/textract.py ---
import boto3
import time
from fastapi import HTTPException
import os

AWS_REGION = os.getenv("AWS_DEFAULT_REGION")
textract_client = boto3.client("textract", region_name=AWS_REGION)

def extract_document_data(bucket: str, s3_key: str) -> dict:
    """Start Textract analysis and return extracted key-value pairs."""

    # Start async analysis (works for multi-page docs)
    response = textract_client.start_document_analysis(
        DocumentLocation={"S3Object": {"Bucket": bucket, "Name": s3_key}},
        FeatureTypes=["FORMS"],  # extracts key-value pairs
    )
    job_id = response["JobId"]

    # Poll until complete
    while True:
        result = textract_client.get_document_analysis(JobId=job_id)
        status = result["JobStatus"]

        if status == "SUCCEEDED":
            break
        elif status == "FAILED":
            raise HTTPException(status_code=500, detail="Textract analysis failed")

        time.sleep(2)

    # Parse key-value pairs from Textract blocks
    return parse_textract_response(result)


def parse_textract_response(response: dict) -> dict:
    """Extract key-value pairs from Textract FORMS response."""
    blocks = response["Blocks"]

    key_map = {}
    value_map = {}
    block_map = {}

    for block in blocks:
        block_id = block["Id"]
        block_map[block_id] = block

        if block["BlockType"] == "KEY_VALUE_SET":
            if "KEY" in block.get("EntityTypes", []):
                key_map[block_id] = block
            else:
                value_map[block_id] = block

    # Build key -> value dictionary
    extracted = {}
    for key_id, key_block in key_map.items():
        key_text = get_text(key_block, block_map)

        value_text = ""
        for relationship in key_block.get("Relationships", []):
            if relationship["Type"] == "VALUE":
                for value_id in relationship["Ids"]:
                    if value_id in value_map:
                        value_text = get_text(value_map[value_id], block_map)

        if key_text:
            extracted[key_text.strip().lower()] = value_text.strip()

    return extracted


def get_text(block: dict, block_map: dict) -> str:
    """Get text from CHILD relationships of a block."""
    text = ""
    for relationship in block.get("Relationships", []):
        if relationship["Type"] == "CHILD":
            for child_id in relationship["Ids"]:
                child = block_map.get(child_id, {})
                if child.get("BlockType") == "WORD":
                    text += child.get("Text", "") + " "
    return text.strip()