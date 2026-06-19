import paramiko
import os
from scp import SCPClient

def deploy():
    host = 'YOUR_SERVER_IP'
    port = 22
    local_path = '/Users/chriszhao/Documents/partner-management-1-main/dist'
    remote_path = '/var/www/partner.velolabs.top'
    
    usernames = ['Chris', 'chris', 'CHRIS', 'admin', 'root']
    passwords = ['YOUR_PASSWORD', '1989', 'your_password', 'password']

    for username in usernames:
        for password in passwords:
            try:
                print(f"Trying {username}:{password}...")
                ssh = paramiko.SSHClient()
                ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                
                try:
                    ssh.connect(host, port, username, password, timeout=10)
                    
                    print(f"Connected successfully as {username}!")
                    
                    print(f"Creating directory {remote_path}...")
                    stdin, stdout, stderr = ssh.exec_command(f"mkdir -p {remote_path}")
                    stdout.channel.set_combine_stderr(True)
                    output = stdout.read().decode()
                    if output:
                        print(f"Create dir output: {output}")
                    
                    print(f"Uploading files from {local_path} to {remote_path}...")
                    with SCPClient(ssh.get_transport()) as scp:
                        scp.put(local_path, remote_path, recursive=True)
                    
                    print("Setting permissions...")
                    stdin, stdout, stderr = ssh.exec_command(f"chown -R www-data:www-data {remote_path}")
                    stdout.channel.set_combine_stderr(True)
                    output = stdout.read().decode()
                    if output:
                        print(f"Chown output: {output}")
                    
                    print("Deploy completed successfully!")
                    ssh.close()
                    return True
                
                except paramiko.AuthenticationException:
                    ssh.close()
                    continue
                except Exception as e:
                    print(f"Connection error: {str(e)}")
                    ssh.close()
                    continue
            
            except Exception as e:
                print(f"Error with {username}: {str(e)}")
                continue
    
    print("All authentication attempts failed. Please check your credentials.")
    return False

if __name__ == '__main__':
    deploy()
