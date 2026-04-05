import os
import re
EXTS = (".html", ".css")
for root, _, files in os.walk("."):
    for name in files:
        if not name.endswith(EXTS):
            continue
        path = os.path.join(root, name)
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            data = f.read()
        new = re.sub(
            r'''(?<=["'(])/10/(?!/)''',
            '/',
            data
        )
        if new != data:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new)
            print("Fixed:", path)
print("Done. Removed /10 prefix from URLs.")