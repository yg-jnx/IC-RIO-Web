import fs from 'fs';
import path from 'path';

export default function TermsPage() {
  const html = fs.readFileSync(path.join(process.cwd(), 'assets/legal/TermAndConditionV1.html'), 'utf-8');
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
