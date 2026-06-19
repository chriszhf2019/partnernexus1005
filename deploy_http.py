import requests
import os
import zipfile
import io

def deploy():
    host = 'YOUR_SERVER_IP'
    local_path = '/Users/chriszhao/Documents/partner-management-1-main/dist'
    upload_url = f'http://{host}:8080/upload'
    
    print(f"Creating zip archive of {local_path}...")
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(local_path):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, local_path)
                zipf.write(file_path, arcname)
    zip_buffer.seek(0)
    
    print(f"Uploading to {upload_url}...")
    try:
        response = requests.post(upload_url, files={'file': ('dist.zip', zip_buffer, 'application/zip')})
        if response.status_code == 200:
            print("Upload successful!")
            print(response.text)
            return True
        else:
            print(f"Upload failed with status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"HTTP upload failed: {str(e)}")
        return False

if __name__ == '__main__':
    deploy()
