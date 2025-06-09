from flask import Flask, request, jsonify
from g4f.client import Client

app = Flask(__name__)
client = Client()

@app.route('/')
def health():
    return "OK", 200

@app.route('/chat', methods=['POST'])
def chat_with_gpt():
    try:
        data = request.get_json()
        message = data.get("message", "")

        if not message:
            return jsonify({"error": "Message is required"}), 400

        response = client.chat.completions.create(
            model="gpt-4.1",
            messages=[{"role": "user", "content": message}],
            web_search=False
        )

        return jsonify({"response": response.choices[0].message.content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
