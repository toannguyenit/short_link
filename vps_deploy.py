import sys
import paramiko

def deploy_on_vps():
    password = None
    try:
        with open(".env", "r") as f:
            for line in f:
                if line.startswith("VPS_PASSWORD="):
                    password = line.strip().split("=", 1)[1]
    except Exception as e:
        print(f"Error reading local .env: {e}")
        sys.exit(1)

    if not password:
        print("VPS_PASSWORD not found in .env")
        sys.exit(1)

    ip = "103.252.93.178"
    username = "root"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        print("Connecting to VPS via SSH...")
        ssh.connect(ip, username=username, password=password, timeout=20)
        
        def run_cmd(cmd, description):
            print(f"\n---> Running: {description}...")
            stdin, stdout, stderr = ssh.exec_command(cmd)
            
            # Read stdout and stderr
            out = stdout.read().decode('utf-8', errors='ignore')
            err = stderr.read().decode('utf-8', errors='ignore')
            status = stdout.channel.recv_exit_status()
            
            if out:
                sys.stdout.buffer.write(out.encode('utf-8'))
            if err:
                sys.stderr.buffer.write(err.encode('utf-8'))
            if status != 0:
                print(f"\nERROR: {description} failed with status {status}")
                sys.exit(status)
            return status

        # 1. Stop any currently running stack to free up ports and memory
        run_cmd("docker compose -f /opt/url-shortener/app/docker-compose.yml down || true", "Stopping old application services")
        run_cmd("docker stop urlshortener-auth urlshortener-url urlshortener-redirect urlshortener-analytics urlshortener-gateway urlshortener-frontend urlshortener-nginx || true", "Force stopping containers")

        # 2. Clean up old code directories (preserving certbot/ and data/ folders)
        run_cmd("rm -rf /opt/url-shortener-temp && rm -rf /opt/url-shortener/app /opt/url-shortener/infra /opt/url-shortener/nginx /opt/url-shortener/url-shortener-be /opt/url-shortener/url-shortener-fe", "Cleaning up old directories")

        # 3. Clone new repo from GitHub
        run_cmd("git clone https://github.com/toannguyenit/short_link.git /opt/url-shortener-temp", "Cloning new repository from GitHub")

        # 4. Set up the final folders on VPS
        run_cmd("mkdir -p /opt/url-shortener", "Ensuring /opt/url-shortener folder exists")
        run_cmd("cp -r /opt/url-shortener-temp/url-shortener-be/deploy/. /opt/url-shortener/", "Copying deploy configs")
        run_cmd("cp -r /opt/url-shortener-temp/url-shortener-be /opt/url-shortener/url-shortener-be", "Moving backend source")
        run_cmd("cp -r /opt/url-shortener-temp/url-shortener-fe /opt/url-shortener/url-shortener-fe", "Moving frontend source")
        run_cmd("rm -rf /opt/url-shortener-temp", "Cleaning up temporary clone folder")

        # 5. Restore .env file via SFTP
        print("\n---> Restoring remote .env file...")
        sftp = ssh.open_sftp()
        env_content = """DOMAIN=urlshort.toannguyenit.com
API_URL=https://api-urlshort.toannguyenit.com
SHORT_URL_BASE=https://go-urlshort.toannguyenit.com
FRONTEND_URL=https://urlshort.toannguyenit.com

JWT_SECRET=supersecretjwtkeyholdingfortyeeightbytesvalueforsecurity
GHCR_OWNER=toannguyenit
IMAGE_TAG=latest

MONGO_DB=urlshortener

RABBITMQ_USER=urlshortener
RABBITMQ_PASSWORD=urlshortenerpwd
RABBITMQ_VHOST=urlshortener

GOOGLE_CLIENT_ID=751785349464-t67s34loabfj8ht1tak75hd2aq489lrr.apps.googleusercontent.com
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
"""
        with sftp.open("/opt/url-shortener/.env", "w") as f:
            f.write(env_content)
        sftp.close()
        print("Successfully restored remote .env file!")

        # 6. Build the Docker images locally on the VPS (fast build since VPS has 8 CPUs and 16GB RAM)
        run_cmd("docker build -t ghcr.io/toannguyenit/url-shortener-auth:latest -f /opt/url-shortener/url-shortener-be/auth-service/Dockerfile /opt/url-shortener/url-shortener-be", "Building auth-service image")
        run_cmd("docker build -t ghcr.io/toannguyenit/url-shortener-url:latest -f /opt/url-shortener/url-shortener-be/url-service/Dockerfile /opt/url-shortener/url-shortener-be", "Building url-service image")
        run_cmd("docker build -t ghcr.io/toannguyenit/url-shortener-redirect:latest -f /opt/url-shortener/url-shortener-be/redirect-service/Dockerfile /opt/url-shortener/url-shortener-be", "Building redirect-service image")
        run_cmd("docker build -t ghcr.io/toannguyenit/url-shortener-analytics:latest -f /opt/url-shortener/url-shortener-be/analytics-service/Dockerfile /opt/url-shortener/url-shortener-be", "Building analytics-service image")
        run_cmd("docker build -t ghcr.io/toannguyenit/url-shortener-gateway:latest -f /opt/url-shortener/url-shortener-be/api-gateway/Dockerfile /opt/url-shortener/url-shortener-be", "Building api-gateway image")
        
        # Build frontend with the production env vars
        fe_build_cmd = (
            "docker build -t ghcr.io/toannguyenit/url-shortener-fe:latest "
            "--build-arg NEXT_PUBLIC_API_URL=https://api-urlshort.toannguyenit.com "
            "--build-arg NEXT_PUBLIC_SHORT_URL_BASE=https://go-urlshort.toannguyenit.com "
            "-f /opt/url-shortener/url-shortener-fe/Dockerfile /opt/url-shortener/url-shortener-fe"
        )
        run_cmd(fe_build_cmd, "Building frontend image")

        # 7. Start database infrastructure (network, MongoDB, Redis, RabbitMQ)
        run_cmd("chmod +x /opt/url-shortener/infra-up.sh && /opt/url-shortener/infra-up.sh", "Starting database infrastructure")

        # 8. Check and generate Let's Encrypt SSL certificates if missing
        cert_dir = "/opt/url-shortener/certbot/conf/live/urlshort.toannguyenit.com"
        print(f"\n---> Checking if SSL certificates exist at {cert_dir}...")
        stdin, stdout, stderr = ssh.exec_command(f"[ -d {cert_dir} ]")
        status = stdout.channel.recv_exit_status()
        
        if status != 0:
            print("SSL certificates not found! Requesting new certificates via Certbot standalone...")
            run_cmd("docker stop urlshortener-nginx || true", "Stopping Nginx to free port 80 for Certbot")
            certbot_cmd = (
                "docker run --rm -p 80:80 "
                "-v /opt/url-shortener/certbot/conf:/etc/letsencrypt "
                "-v /opt/url-shortener/certbot/www:/var/www/certbot "
                "certbot/certbot certonly --standalone --preferred-challenges http "
                "--email toannguyen.hcmute@gmail.com --agree-tos --no-eff-email "
                "-d urlshort.toannguyenit.com -d api-urlshort.toannguyenit.com -d go-urlshort.toannguyenit.com"
            )
            run_cmd(certbot_cmd, "Requesting Let's Encrypt SSL certificates")
        else:
            print("SSL certificates already exist. Skipping Certbot request.")

        # 9. Start application services
        run_cmd("docker compose --env-file /opt/url-shortener/.env -f /opt/url-shortener/app/docker-compose.yml up -d --remove-orphans", "Starting application services")

        # 9. Prune old unused docker resources to save space
        run_cmd("docker image prune -f", "Pruning old docker images")

        # 10. Check status
        run_cmd("docker compose --env-file /opt/url-shortener/.env -f /opt/url-shortener/app/docker-compose.yml ps", "Verifying running services")

        print("\n=============================================")
        print("DEPLOYMENT SUCCESSFULLY COMPLETED!")
        print("=============================================")
        
        ssh.close()
    except Exception as e:
        print(f"Deployment failed: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    deploy_on_vps()
