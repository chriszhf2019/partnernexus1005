import paramiko
import os
from pathlib import Path
import sys

def try_deploy(host, username, password, local_path, remote_path):
    try:
        print(f'  尝试 {username}:{password[:4]}...')
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host, 22, username, password, timeout=15, banner_timeout=15)
        print(f'  ✅ {username} 登录成功！')
        
        stdin, stdout, stderr = ssh.exec_command(f'mkdir -p {remote_path} && rm -rf {remote_path}/*')
        
        sftp = ssh.open_sftp()
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
        
        sftp.close()
        print(f'  ✅ 上传 {count} 个文件完成')
        
        ssh.exec_command(f'chown -R www-data:www-data {remote_path} && chmod -R 755 {remote_path}')
        ssh.close()
        return True
    except Exception as e:
        print(f'  ❌ 失败: {str(e)[:60]}')
        return False

def main():
    host = os.environ.get('DEPLOY_HOST', 'YOUR_SERVER_IP')
    local_path = '/Users/chriszhao/Documents/partner-management-1-main/dist'
    remote_path = '/var/www/partner.velolabs.top'

    # 凭据通过环境变量提供，例如：
    #   DEPLOY_USER=root DEPLOY_PASSWORD=xxx python deploy_try_all.py
    combinations = [
        (os.environ.get('DEPLOY_USER', 'root'), os.environ.get('DEPLOY_PASSWORD', 'YOUR_PASSWORD')),
    ]
    
    print(f'在 {host} 上测试 {len(combinations)} 种登录组合...\n')
    
    for username, password in combinations:
        if try_deploy(host, username, password, local_path, remote_path):
            print(f'\n🎉 部署完成！请访问 https://partner.velolabs.top')
            return
    
    print('\n❌ 所有组合都失败，请检查服务器凭据')
    sys.exit(1)

if __name__ == '__main__':
    main()
