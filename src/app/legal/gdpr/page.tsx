import fs from 'fs';
import path from 'path';

export default function GdprPage() {
  const html = fs.readFileSync(path.join(process.cwd(), 'assets/legal/GDPRV1.html'), 'utf-8');
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
