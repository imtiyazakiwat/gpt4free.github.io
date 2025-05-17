import os
import requests

for root, _, files in os.walk(os.path.dirname(__file__)):
    for file in files:
        if file.endswith(".md"):
            print("File:", file.replace(".md", ".html"))
            with open(os.path.join(root, file), 'r') as f:
                try:
                    content = f.read()
                    print("Content:", content.splitlines()[0])
                except Exception as e:
                    print(f"Error reading file {file}: {e}")
            html = requests.post(
                "https://api.github.com/markdown",
                json={"text": content.replace(".md)", ".html)").replace("(../)", "(../docs/)")},
                headers={"Accept": "application/vnd.github+json", "Authorization": f"Bearer {os.getenv("GITHUB_TOKEN")}"}
            ).text
            with open(os.path.join(root, "template.html"), 'r') as f:
                template = f.read()
            filename = "index.html" if file == "README.md" else file.replace(".md", ".html")
            with open(os.path.join(root, filename), 'w') as f:
                f.write(template.replace("{{ article }}", html))
    break