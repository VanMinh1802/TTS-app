import os
import boto3
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv()

r2_account_id = os.getenv("R2_ACCOUNT_ID")
r2_access_key = os.getenv("R2_ACCESS_KEY_ID")
r2_secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
bucket_name = os.getenv("R2_BUCKET_NAME")

endpoint_url = f"https://{r2_account_id}.r2.cloudflarestorage.com"

client = boto3.client(
    "s3",
    aws_access_key_id=r2_access_key,
    aws_secret_access_key=r2_secret_key,
    endpoint_url=endpoint_url,
    config=Config(signature_version="s3v4", region_name="auto"),
)

cors_configuration = {
    'CORSRules': [{
        'AllowedHeaders': ['*'],
        'AllowedMethods': ['GET', 'HEAD'],
        'AllowedOrigins': ['*'],
        'ExposeHeaders': ['Content-Length', 'Content-Type']
    }]
}

try:
    print(f"Applying CORS to bucket {bucket_name}...")
    client.put_bucket_cors(
        Bucket=bucket_name,
        CORSConfiguration=cors_configuration
    )
    print("CORS configuration applied successfully!")
except Exception as e:
    print(f"Error applying CORS: {e}")
