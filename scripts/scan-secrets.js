const fs = require('fs');
const path = require('path');

const secretPatterns = [
  { name: 'Private Key', regex: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/i },
  { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'Generic Secret Assignment', regex: /(?:api_?key|auth_?key|secret|password|token)\s*[:=]\s*['"][a-zA-Z0-9_\-\.]{16,}['"]/i },
  { name: 'Database Connection String with Password', regex: /postgres(?:ql)?:\/\/[^:]+:(?!replace_me)[^@]+@/i },
  { name: 'JWT Token', regex: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/ },
  { name: 'Stripe Secret Key', regex: /sk_live_[0-9a-zA-Z]{24}/ },
  { name: 'Twilio Auth Token', regex: /(?:twilio.*auth.*token|auth_token)\s*[:=]\s*['"][a-zA-Z0-9]{32}['"]/i },
  { name: 'Renflair/MSG91 Key', regex: /(?:renflair|msg91).*(?:key|token|auth)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i },
  { name: 'Exposed Verification/Session Token', regex: /(?:verificationToken|sessionToken)\s*[:=]\s*['"][a-f0-9]{32,}['"]/i },
];

const ignoredDirs = new Set(['.git', 'node_modules', '.next', 'dist', 'build', '.gemini']);
const ignoredFiles = new Set(['.env', '.env.local', 'package-lock.json', 'scan-secrets.js']);

let findings = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile()) {
      if (ignoredFiles.has(entry.name)) continue;
      // Skip binary files, media, and images
      if (/\.(png|jpg|jpeg|gif|ico|webp|svg|woff|woff2|ttf|eot)$/i.test(entry.name)) continue;
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Skip placeholder strings & test fixtures
          if (
            line.includes('replace_me') ||
            line.includes('your_') ||
            line.includes('example') ||
            line.includes('placeholder') ||
            line.includes('test_secret') ||
            line.includes('dummy_') ||
            line.includes('mock_') ||
            line.includes('test_key') ||
            line.includes('DifferentPassword')
          ) continue;

          for (const pattern of secretPatterns) {
            if (pattern.regex.test(line)) {
              findings.push({ file: fullPath, line: i + 1, type: pattern.name });
            }
          }
        }
      } catch (err) {}
    }
  }
}

scanDir('.');
console.log('--- SECRET SCAN RESULTS ---');
console.log('Total files checked. Findings count:', findings.length);
findings.forEach(f => {
  console.log(`[ALERT] ${f.file}:${f.line} -> Matched rule: ${f.type}`);
});
