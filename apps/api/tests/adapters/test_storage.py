"""S3 through boto3, with botocore's Stubber in place of the network."""

import io

import boto3
import pytest
from botocore.response import StreamingBody
from botocore.stub import Stubber

from app.adapters.storage import S3ObjectStorage


@pytest.fixture
def s3():
    client = boto3.client(
        "s3",
        region_name="us-east-1",
        endpoint_url="https://r2.example.com",
        aws_access_key_id="id",
        aws_secret_access_key="secret",
    )
    with Stubber(client) as stubber:
        yield S3ObjectStorage(client=client, bucket="zuula-media"), stubber
        stubber.assert_no_pending_responses()


async def test_put_get_delete(s3):
    storage, stubber = s3
    stubber.add_response(
        "put_object",
        {},
        {
            "Bucket": "zuula-media",
            "Key": "submissions/a/original",
            "Body": b"img",
            "ContentType": "image/png",
        },
    )
    stubber.add_response(
        "get_object",
        {"Body": StreamingBody(io.BytesIO(b"img"), 3)},
        {"Bucket": "zuula-media", "Key": "submissions/a/original"},
    )
    stubber.add_response(
        "delete_object", {}, {"Bucket": "zuula-media", "Key": "submissions/a/original"}
    )

    ref = await storage.put(key="submissions/a/original", data=b"img", content_type="image/png")
    assert ref == "s3://zuula-media/submissions/a/original"
    assert await storage.get(key="submissions/a/original") == b"img"
    await storage.delete(key="submissions/a/original")


async def test_errors_propagate(s3):
    storage, stubber = s3
    stubber.add_client_error("get_object", service_error_code="NoSuchKey", http_status_code=404)
    with pytest.raises(Exception, match="NoSuchKey"):
        await storage.get(key="missing")
