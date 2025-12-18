# Piston with auto-install Python
# Build: docker buildx build --platform linux/amd64 -t lenylvt/piston-python:latest --push .

FROM ghcr.io/engineer-man/piston

# Create startup script using Node.js for HTTP requests (already in image)
RUN printf '#!/bin/bash\n\
set -e\n\
\n\
# Start API in background\n\
cd /piston_api && node src &\n\
API_PID=$!\n\
\n\
echo "Waiting for API..."\n\
sleep 8\n\
\n\
# Check and install Python using Node.js\n\
node -e '\''\n\
const http = require("http");\n\
\n\
function get(url) {\n\
  return new Promise((resolve, reject) => {\n\
    http.get(url, (res) => {\n\
      let data = "";\n\
      res.on("data", (chunk) => data += chunk);\n\
      res.on("end", () => resolve(data));\n\
    }).on("error", reject);\n\
  });\n\
}\n\
\n\
function post(url, body) {\n\
  return new Promise((resolve, reject) => {\n\
    const req = http.request(url, { method: "POST", headers: { "Content-Type": "application/json" } }, (res) => {\n\
      let data = "";\n\
      res.on("data", (chunk) => data += chunk);\n\
      res.on("end", () => resolve(data));\n\
    });\n\
    req.on("error", reject);\n\
    req.write(JSON.stringify(body));\n\
    req.end();\n\
  });\n\
}\n\
\n\
async function main() {\n\
  const runtimes = await get("http://localhost:2000/api/v2/runtimes");\n\
  if (!runtimes.includes("python")) {\n\
    console.log("Installing Python 3.10.0...");\n\
    await post("http://localhost:2000/api/v2/packages", { language: "python", version: "3.10.0" });\n\
    console.log("Install request sent, waiting...");\n\
    await new Promise(r => setTimeout(r, 60000));\n\
    console.log("Python installed!");\n\
  } else {\n\
    console.log("Python already installed");\n\
  }\n\
}\n\
\n\
main().catch(console.error);\n\
'\''\n\
\n\
wait $API_PID\n\
' > /start.sh && chmod +x /start.sh

CMD ["/bin/bash", "/start.sh"]
