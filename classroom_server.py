#!/usr/bin/env python3
"""Servidor de aula local de Cuaderno Vivo (sin Internet ni dependencias externas)."""
from __future__ import annotations

import argparse
import base64
import binascii
import json
import mimetypes
import secrets
import socket
import tempfile
import threading
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote, urlparse

from real_exam_core import CuadernoRepository, ExamPdfGenerator, OmrScanner, ScanError, ValidationError

ROOT = Path(__file__).resolve().parent
SESSIONS: dict[str, dict] = {}
LOCK = threading.Lock()
MAX_BODY = 20 * 1024 * 1024
BLOCKED = {"backups", "dist", "tests", "tools", ".git", ".github", "__pycache__"}


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def lan_ip() -> str:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("10.255.255.255", 1))
        return sock.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        sock.close()


class ClassroomHandler(SimpleHTTPRequestHandler):
    server_version = "CuadernoVivoClassroom/1.0"

    def log_message(self, format: str, *args) -> None:
        print(f"[{self.log_date_time_string()}] {self.client_address[0]} {format % args}")

    def send_json(self, payload: dict | list, status: int = 200) -> None:
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(raw)

    def send_bytes(self, payload: bytes, content_type: str, status: int = 200, filename: str | None = None) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        if filename:
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.end_headers()
        self.wfile.write(payload)

    @property
    def repository(self) -> CuadernoRepository:
        return self.server.repository

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > MAX_BODY:
            raise ValueError("Solicitud vacía o demasiado grande.")
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def session_id_from_path(self) -> tuple[str | None, str | None]:
        parts = [unquote(part) for part in urlparse(self.path).path.split("/") if part]
        if len(parts) >= 4 and parts[:3] == ["api", "classroom", "session"]:
            return parts[3].upper(), parts[4] if len(parts) > 4 else None
        return None, None

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/classroom/status":
            self.send_json({"ok": True, "mode": "local-network", "internetRequired": False})
            return
        parts = [unquote(part) for part in path.split("/") if part]
        if parts == ["api", "real", "classes"]:
            self.send_json(self.repository.list_classes())
            return
        if len(parts) == 4 and parts[:3] == ["api", "real", "classes"]:
            try:
                self.send_json(self.repository.get_class(parts[3]))
            except KeyError as exc:
                self.send_json({"error": str(exc)}, 404)
            return
        if len(parts) == 5 and parts[:3] == ["api", "real", "classes"] and parts[4] == "exams":
            try:
                self.send_json(self.repository.list_exams(parts[3]))
            except KeyError as exc:
                self.send_json({"error": str(exc)}, 404)
            return
        if len(parts) == 5 and parts[:3] == ["api", "real", "exams"] and parts[4] == "pdf":
            exam_id = parts[3]
            try:
                with tempfile.TemporaryDirectory() as directory:
                    output = Path(directory) / "examenes-cuaderno-vivo.pdf"
                    ExamPdfGenerator(self.repository).generate(exam_id, output)
                    self.send_bytes(output.read_bytes(), "application/pdf", filename="examenes-cuaderno-vivo.pdf")
            except KeyError as exc:
                self.send_json({"error": str(exc)}, 404)
            return
        if (
            len(parts) == 7
            and parts[:3] == ["api", "real", "classes"]
            and parts[4] == "students"
            and parts[6] == "history"
        ):
            try:
                self.send_json(self.repository.student_history(parts[3], parts[5].upper()))
            except KeyError as exc:
                self.send_json({"error": str(exc)}, 404)
            return
        session_id, action = self.session_id_from_path()
        if session_id:
            with LOCK:
                session = SESSIONS.get(session_id)
                if not session:
                    self.send_json({"error": "La sesión no existe o el servidor se ha reiniciado."}, 404)
                    return
                if action == "results":
                    self.send_json({"id": session_id, "results": list(session["results"].values())})
                    return
                if action is None:
                    self.send_json({"id": session_id, "title": session["title"], "level": session["level"], "questions": [{"id": q["id"], "prompt": q["prompt"], "options": q["options"], "skill": q.get("skill", "")} for q in session["questions"]]})
                    return
            self.send_json({"error": "Ruta de aula no válida."}, 404)
            return
        self.serve_static(path)

    def serve_static(self, request_path: str) -> None:
        relative = unquote(request_path).lstrip("/") or "index.html"
        parts = Path(relative).parts
        if any(part in BLOCKED or part.startswith(".") for part in parts):
            self.send_error(404)
            return
        target = (ROOT / relative).resolve()
        if ROOT not in target.parents and target != ROOT:
            self.send_error(403)
            return
        if target.is_dir():
            target = target / "index.html"
        if not target.is_file():
            self.send_error(404)
            return
        mime = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        raw = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", f"{mime}; charset=utf-8" if mime.startswith(("text/", "application/javascript")) else mime)
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store" if target.suffix in {".html", ".js", ".css"} else "public, max-age=3600")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(raw)

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        try:
            payload = self.read_json()
        except (ValueError, json.JSONDecodeError) as exc:
            self.send_json({"error": str(exc)}, 400)
            return
        if path == "/api/real/scans":
            try:
                encoded = str(payload.get("imageBase64", ""))
                raw = base64.b64decode(encoded, validate=True)
                if not raw or len(raw) > 12 * 1024 * 1024:
                    raise ValidationError("La imagen debe ocupar entre 1 byte y 12 MB.")
                filename = Path(str(payload.get("filename", "scan.png"))).name
                suffix = Path(filename).suffix.lower()
                if suffix not in {".png", ".jpg", ".jpeg", ".webp"}:
                    raise ValidationError("Formato de imagen no permitido.")
                with tempfile.TemporaryDirectory() as directory:
                    image_path = Path(directory) / f"scan{suffix}"
                    image_path.write_bytes(raw)
                    result = OmrScanner(self.repository).process_and_grade(image_path)
                self.send_json(result, 201)
            except (binascii.Error, ValidationError, ScanError, TypeError, ValueError) as exc:
                self.send_json({"error": str(exc)}, 400)
            except KeyError as exc:
                self.send_json({"error": str(exc)}, 404)
            return
        if path == "/api/real/classes":
            try:
                classroom = self.repository.create_class(
                    payload.get("name", ""), int(payload.get("studentCount", 24))
                )
                self.send_json(classroom, 201)
            except (ValidationError, TypeError, ValueError) as exc:
                self.send_json({"error": str(exc)}, 400)
            return
        if path == "/api/real/exams":
            try:
                exam = self.repository.create_exam(
                    payload.get("classId", ""),
                    title=payload.get("title", ""),
                    subject=payload.get("subject", ""),
                    version=payload.get("version", ""),
                    questions=payload.get("questions", []),
                )
                self.send_json(exam, 201)
            except KeyError as exc:
                self.send_json({"error": str(exc)}, 404)
            except (ValidationError, TypeError, ValueError) as exc:
                self.send_json({"error": str(exc)}, 400)
            return
        real_parts = [unquote(part) for part in path.split("/") if part]
        if len(real_parts) == 5 and real_parts[:3] == ["api", "real", "exams"] and real_parts[4] == "attempts":
            try:
                attempt = self.repository.save_attempt(
                    real_parts[3],
                    payload.get("student", ""),
                    payload.get("answers", {}),
                    score=float(payload.get("score", 0)),
                    maximum=float(payload.get("maximum", 0)),
                    source="digital-local",
                )
                self.send_json(attempt, 201)
            except KeyError as exc:
                self.send_json({"error": str(exc)}, 404)
            except (ValidationError, TypeError, ValueError) as exc:
                self.send_json({"error": str(exc)}, 400)
            return
        if path == "/api/classroom/session":
            questions = payload.get("questions")
            if not isinstance(questions, list) or not 1 <= len(questions) <= 10:
                self.send_json({"error": "La sesión necesita entre 1 y 10 preguntas."}, 400)
                return
            for question in questions:
                if not isinstance(question.get("options"), list) or len(question["options"]) != 4 or question.get("correct") not in "ABCD":
                    self.send_json({"error": "Cada pregunta necesita cuatro opciones y una solución válida."}, 400)
                    return
            session_id = "".join(secrets.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(6))
            with LOCK:
                SESSIONS[session_id] = {"title": str(payload.get("title", "Refuerzo"))[:120], "level": str(payload.get("level", ""))[:80], "questions": questions, "createdAt": now(), "results": {}}
            self.send_json({"id": session_id, "createdAt": SESSIONS[session_id]["createdAt"]}, 201)
            return
        session_id, action = self.session_id_from_path()
        if session_id and action == "answers":
            student = str(payload.get("student", "")).strip().upper()
            if not student or len(student) > 12 or not all(char.isalnum() or char in "-_" for char in student):
                self.send_json({"error": "Escribe un código de alumno válido, por ejemplo A07."}, 400)
                return
            with LOCK:
                session = SESSIONS.get(session_id)
                if not session:
                    self.send_json({"error": "La sesión no existe o ha finalizado."}, 404)
                    return
                answers = payload.get("answers") or {}
                solutions = []
                score = 0
                for question in session["questions"]:
                    selected = str(answers.get(question["id"]) or "")
                    correct = question["correct"]
                    is_correct = selected == correct
                    score += int(is_correct)
                    selected_index = ord(selected) - 65 if selected in "ABCD" else -1
                    correct_index = ord(correct) - 65
                    solutions.append({"id": question["id"], "prompt": question["prompt"], "selected": selected, "selectedText": question["options"][selected_index] if selected_index >= 0 else "", "correct": correct, "correctText": question["options"][correct_index], "explanation": question.get("explanation", ""), "isCorrect": is_correct})
                result = {"student": student, "score": score, "total": len(session["questions"]), "submittedAt": now()}
                session["results"][student] = result
            self.send_json({**result, "solutions": solutions})
            return
        self.send_json({"error": "Ruta de aula no válida."}, 404)


class CuadernoHTTPServer(ThreadingHTTPServer):
    def __init__(self, address: tuple[str, int], data_dir: Path):
        self.data_dir = data_dir
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.repository = CuadernoRepository(self.data_dir / "cuaderno-vivo.sqlite3")
        super().__init__(address, ClassroomHandler)

    def server_close(self) -> None:
        try:
            self.repository.close()
        finally:
            super().server_close()


def create_server(host: str = "0.0.0.0", port: int = 4180, data_dir: Path | None = None) -> CuadernoHTTPServer:
    return CuadernoHTTPServer((host, port), data_dir or (ROOT / "data"))


def main() -> None:
    parser = argparse.ArgumentParser(description="Aula local sin Internet de Cuaderno Vivo")
    parser.add_argument("--port", type=int, default=4180)
    parser.add_argument("--data-dir", type=Path, default=ROOT / "data")
    args = parser.parse_args()
    server = create_server("0.0.0.0", args.port, args.data_dir)
    print("\nCuaderno Vivo · aula local")
    print(f"Profesor: http://127.0.0.1:{args.port}")
    print(f"Dispositivos del aula: http://{lan_ip()}:{args.port}")
    print("No necesita Internet. Todos los dispositivos deben estar en la misma red local.")
    print("Pulsa Ctrl+C para cerrar y borrar las sesiones de la memoria.\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nAula cerrada. Sesiones eliminadas.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
