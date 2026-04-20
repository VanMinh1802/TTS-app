import struct

# Check the actual data size
with open('test_output.wav', 'rb') as f:
    # Skip to data chunk
    f.seek(36)
    data_id = f.read(4)
    data_size = struct.unpack('<I', f.read(4))[0]
    
print('Data chunk ID:', data_id)
print('Data chunk size:', data_size)

# Check audio data length
import numpy as np
with open('test_output.wav', 'rb') as f:
    f.seek(44)
    audio_bytes = f.read()
    print('Audio bytes read:', len(audio_bytes))
    audio = np.frombuffer(audio_bytes, dtype=np.int16)
    print('Audio samples:', len(audio))
    print('Expected samples at 22050 Hz * 3s:', 22050 * 3)