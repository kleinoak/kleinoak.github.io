import { AdminApp } from "@/cms/components/AdminApp";

/**
 * The content editor.
 *
 * Statically exported like the rest of the site — everything it does (signing
 * in, reading content, publishing) happens in the editor's browser against
 * GitHub's API. There is no server and no database behind this page.
 */
export default function AdminPage() {
  return <AdminApp />;
}
