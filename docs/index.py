import os

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
    break