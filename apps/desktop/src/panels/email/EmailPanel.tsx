export function EmailPanel() {
  return (
    <section className="panel panel--email" aria-label="Email">
      <h3>Email</h3>
      <article className="email-draft">
        <h4>Draft reply</h4>
        <p>Thanks for reaching out — deploy is green on Vercel.</p>
        <button type="button">Approve draft</button>
      </article>
    </section>
  );
}
