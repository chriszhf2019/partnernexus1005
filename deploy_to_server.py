import paramiko
import os
from pathlib import Path

def main():
    host = os.environ.get('DEPLOY_HOST', 'YOUR_SERVER_IP')
    port = 22
    local_path = '/Users/chriszhao/Documents/partner-management-1-main/dist'
    remote_path = '/var/www/partner.velolabs.top'

    username = os.environ.get('DEPLOY_USER', 'root')
    password = os.environ.get('DEPLOY_PASSWORD', 'YOUR_PASSWORD')
    
    print(f'尝试连接 {username}@{host}...')
    
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host, port, username, password, timeout=30, banner_timeout=30)
        
        print(f'✅ 连接成功！')
        
        stdin, stdout, stderr = ssh.exec_command(f'mkdir -p {remote_path} && rm -rf {remote_path}/*')
        print(f'准备目录: {stdout.read().decode()} {stderr.read().decode()}')
        
        sftp = ssh.open_sftp()
        
        print(f'📤 开始上传文件 {local_path} -> {remote_path}...')
        count = 0
        for root, dirs, files in os.walk(local_path):
            for file in files:
                local_file = os.path.join(root, file)
                rel_path = os.path.relpath(local_file, local_path)
                remote_file = os.path.join(remote_path, rel_path)
                
                remote_dir = os.path.dirname(remote_file)
                if remote_dir != remote_path:
                    try:
                        sftp.stat(remote_dir)
                    except IOError:
                        parts = Path(remote_dir).parts
                        current = ''
                        for part in parts:
                            current = os.path.join(current, part)
                            try:
                                sftp.stat(current)
                            except IOError:
                                sftp.mkdir(current)
                
                sftp.put(local_file, remote_file)
                count += 1
                if count % 10 == 0:
                    print(f'  已上传 {count} 个文件...')
        
        sftp.close()
        print(f'✅ 上传完成！共 {count} 个文件')
        
        stdin, stdout, stderr = ssh.exec_command(f'chown -R www-data:www-data {remote_path} && chmod -R 755 {remote_path}')
        print(f'权限设置完成')
        
        ssh.close()
        print(f'🎉 部署完成！请访问 https://partner.velolabs.top')
        
    except Exception as e:
        print(f'❌ 部署失败: {str(e)}')
        return False
    
    return True

if __name__ == '__main__':
    main()
