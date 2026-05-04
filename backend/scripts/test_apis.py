# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
import requests

# F3.3
print('=== F3.3 Text Normalization ===')
resp = requests.post('http://localhost:8000/api/tts/normalize',
    json={'text': 'Ngay 20/06/2025', 'mode': 'standard', 'dialect': 'northern'})
print('Status:', resp.status_code)
if resp.status_code == 200:
    data = resp.json()
    print('Input length:', data.get('original_length'))
    print('Output:', data.get('normalized_text'))
    print('Output length:', data.get('normalized_length'))
else:
    print('Error:', resp.text[:300])

# F3.5
print('\n=== F3.5 Language Detection ===')
resp = requests.post('http://localhost:8000/api/tts/detect-language',
    json={'text': 'Hello world. Xin chao'})
print('Status:', resp.status_code)
if resp.status_code == 200:
    data = resp.json()
    print('Language:', data.get('language'))
    print('Confidence:', data.get('confidence'))
    print('Segments:', len(data.get('segments', [])))
else:
    print('Error:', resp.text[:300])
    
# F3.4 - Dictionary (needs auth)
print('\n=== F3.4 Custom Dictionary ===')
print('Status: requires authentication')
print('API: /api/dictionary (GET/POST)')