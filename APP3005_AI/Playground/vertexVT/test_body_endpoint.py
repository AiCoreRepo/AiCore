"""
Test script to verify body_analyze_json endpoint works
"""
import requests
import base64

# Create a tiny 1x1 red pixel PNG
tiny_png = base64.b64encode(
    b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
    b'\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf'
    b'\xc0\x00\x00\x00\x03\x00\x01\x00\x18\xdd\x8d\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
).decode('utf-8')

print("Testing /body_analyze_json endpoint...")
print(f"Sending request to http://localhost:8000/body_analyze_json")

try:
    response = requests.post(
        'http://localhost:8000/body_analyze_json',
        json={'image_base64': tiny_png},
        timeout=10
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("\n✅ SUCCESS! Endpoint is working!")
    else:
        print(f"\n❌ FAILED with status {response.status_code}")
        
except Exception as e:
    print(f"\n❌ ERROR: {e}")
