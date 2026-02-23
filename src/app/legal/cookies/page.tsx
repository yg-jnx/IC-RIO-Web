import fs from 'fs';
import path from 'path';

export default function CookiesPage() {
  const html = fs.readFileSync(path.join(process.cwd(), 'assets/legal/CookiePolicyV1.html'), 'utf-8');
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
