import fs from 'fs';
import path from 'path';

export default function PrivacyPage() {
  const html = fs.readFileSync(path.join(process.cwd(), 'assets/legal/PrivacyPolicyV1.html'), 'utf-8');
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
