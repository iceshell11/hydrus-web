npm run build

docker build -f Dockerfile.nobuild -t hydrus-web-vr .

docker stop hydrus-web-vr
docker rm hydrus-web-vr

docker run -d -p 8084:80 --name hydrus-web-vr hydrus-web-vr