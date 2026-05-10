const fs = require("fs").promises,
  path = require("path"),
  Terser = require("terser"),
  CleanCSS = require("clean-css"),
  { minify: minifyHTML } = require("html-minifier-terser"),
  IGNORES = ["node_modules", ".git", ".hg"],
  REPORT_FILE = "minify-report.json";
async function walk(e, t) {
  const s = [],
    r = await fs.readdir(e, { withFileTypes: !0 });
  for (const i of r) {
    if (IGNORES.includes(i.name)) continue;
    const r = path.join(e, i.name);
    if (i.isDirectory()) s.push(...(await walk(r, t)));
    else {
      const e = path.extname(i.name).toLowerCase();
      t.includes(e) && s.push(r);
    }
  }
  return s;
}
async function processFile(e) {
  try {
    const t = path.extname(e).toLowerCase(),
      s = await fs.readFile(e, "utf8");
    let r;
    if (".js" === t) {
      const e = await Terser.minify(s);
      if (e.error) throw e.error;
      r = e.code;
    } else if (".css" === t) {
      const e = new CleanCSS({}).minify(s);
      if (e.errors.length) throw new Error(e.errors.join("; "));
      r = e.styles;
    } else {
      if (".html" !== t && ".htm" !== t)
        return { file: e, ok: !1, error: "Unsupported extension: " + t };
      r = await minifyHTML(s, {
        collapseWhitespace: !0,
        removeComments: !0,
        removeRedundantAttributes: !0,
        removeEmptyAttributes: !0,
        minifyJS: !0,
        minifyCSS: !0,
      });
    }
    return (
      await fs.writeFile(e, r, "utf8"),
      { file: e, ok: !0, saved: Buffer.byteLength(s) - Buffer.byteLength(r) }
    );
  } catch (t) {
    return { file: e, ok: !1, error: t.message || t };
  }
}
async function main() {
  const e = process.argv.slice(2);
  let t = [];
  if (e.length)
    for (const s of e)
      try {
        (await fs.stat(s)).isDirectory()
          ? t.push(...(await walk(s, [".js", ".css", ".html", ".htm"])))
          : t.push(path.resolve(s));
      } catch {}
  else t = await walk(process.cwd(), [".js", ".css", ".html", ".htm"]);
  if (((t = Array.from(new Set(t))), !t.length))
    return console.log("No files found.");
  const s = [];
  for (const e of t) {
    const t = await processFile(e);
    (t.ok
      ? console.log(`✅ ${e} (saved ${t.saved} bytes)`)
      : console.log(`❌ ${e} (${t.error})`),
      s.push(t));
  }
  try {
    const e = process.argv[1] ? path.resolve(process.argv[1]) : __filename,
      t = await fs.readFile(e, "utf8"),
      r = (await Terser.minify(t)).code;
    (await fs.writeFile(e, r, "utf8"),
      console.log(`✅ Self-minified: ${e}`),
      s.push({
        file: e,
        ok: !0,
        selfMinified: !0,
        originalSize: Buffer.byteLength(t),
        minifiedSize: Buffer.byteLength(r),
        saved: Buffer.byteLength(t) - Buffer.byteLength(r),
      }));
  } catch (e) {
    (console.log(`❌ Self-minify failed: ${e.message || e}`),
      s.push({ file: "self", ok: !1, error: e.message || e }));
  }
}
main().catch((e) => console.log(`❌ Fatal: ${e.stack || e}`));
