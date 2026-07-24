export function EditorPanel() {
  return (
    <section className="panel panel--editor" aria-label="Editor">
      <h3>Editor</h3>
      <textarea
        className="editor-surface"
        defaultValue={"// Monaco editor scaffold (P6)\nexport function hello() {\n  return 'Atomic';\n}\n"}
        rows={12}
      />
    </section>
  );
}
