export function DatabasePanel() {
  return (
    <section className="panel panel--database" aria-label="Database">
      <h3>Database</h3>
      <p>Query UI scaffold with chart preview (P8 / U21).</p>
      <table>
        <thead>
          <tr>
            <th>metric</th>
            <th>value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>signups</td>
            <td>128</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
