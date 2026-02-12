import os
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

APP_PORT = int(os.getenv("PORT", "5000"))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ADMIN_USER = os.getenv("ADMIN_USER", "AnaSantos")
ADMIN_PASS = os.getenv("ADMIN_PASS", "Asantos1969")

app = Flask(__name__)
CORS(app)

@app.get("/api/health")
def health():
    return jsonify(ok=True, status="healthy")

@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    user = data.get("user", "")
    password = data.get("pass", "")
    if user == ADMIN_USER and password == ADMIN_PASS:
        return jsonify(ok=True, message="Login realizado"), 200
    return jsonify(ok=False, message="Usuário ou senha incorretos"), 401

@app.post("/api/upload")
def upload():
    if "file" not in request.files:
        return jsonify(ok=False, message="Arquivo não enviado"), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify(ok=False, message="Nome de arquivo vazio"), 400
    filename = secure_filename(file.filename)
    name, ext = os.path.splitext(filename)
    unique = f"{name}-{uuid.uuid4().hex[:8]}{ext or '.png'}"
    save_path = os.path.join(UPLOAD_DIR, unique)
    file.save(save_path)
    url = f"http://localhost:{APP_PORT}/uploads/{unique}"
    return jsonify(ok=True, url=url, filename=unique), 200

@app.get("/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(UPLOAD_DIR, filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=APP_PORT, debug=False)
