"""Núcleo local verificable de clases, exámenes en papel y corrección OMR.

No usa servicios externos. SQLite conserva el historial; ReportLab genera PDF;
OpenCV procesa fotografías de plantillas controladas. La escritura libre queda
fuera de la corrección automática y debe pasar por revisión docente.
"""
from __future__ import annotations

import io
import json
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import cv2
import numpy as np
import qrcode
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


SCHEMA_VERSION = 1
QR_PREFIX = "CVP1"
LETTERS = "ABCD"
CANONICAL_WIDTH = 1200
CANONICAL_HEIGHT = 1600
OMR_XS = (300, 500, 700, 900)
OMR_Y0 = 650
OMR_ROW_GAP = 100


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class ValidationError(ValueError):
    pass


class ScanError(ValueError):
    pass


class CuadernoRepository:
    """Repositorio SQLite local, transaccional y sin datos personales."""

    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self.connection = sqlite3.connect(str(self.path), check_same_thread=False)
        self.connection.row_factory = sqlite3.Row
        self.connection.execute("PRAGMA foreign_keys = ON")
        self.connection.execute("PRAGMA journal_mode = WAL")
        self.connection.execute("PRAGMA synchronous = FULL")
        self._migrate()

    def _migrate(self) -> None:
        self.connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS metadata (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS classrooms (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS students (
                id TEXT PRIMARY KEY,
                classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
                code TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(classroom_id, code)
            );
            CREATE TABLE IF NOT EXISTS exams (
                id TEXT PRIMARY KEY,
                classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                subject TEXT NOT NULL,
                version TEXT NOT NULL,
                questions_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(classroom_id, title, version)
            );
            CREATE TABLE IF NOT EXISTS attempts (
                id TEXT PRIMARY KEY,
                exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
                student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                answers_json TEXT NOT NULL,
                score REAL NOT NULL,
                maximum REAL NOT NULL,
                source TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS attempts_student_idx
                ON attempts(student_id, created_at DESC);
            """
        )
        self.connection.execute(
            "INSERT OR REPLACE INTO metadata(key,value) VALUES('schema_version',?)",
            (str(SCHEMA_VERSION),),
        )
        self.connection.commit()

    def close(self) -> None:
        if self.connection:
            self.connection.close()
            self.connection = None  # type: ignore[assignment]

    def create_class(self, name: str, student_count: int = 24) -> dict[str, Any]:
        name = str(name).strip()
        if not name:
            raise ValidationError("La clase necesita un nombre.")
        if not 1 <= int(student_count) <= 40:
            raise ValidationError("La clase debe tener entre 1 y 40 alumnos.")
        classroom_id = uuid.uuid4().hex
        created_at = utc_now()
        with self.connection:
            self.connection.execute(
                "INSERT INTO classrooms(id,name,created_at) VALUES(?,?,?)",
                (classroom_id, name[:120], created_at),
            )
            for index in range(1, int(student_count) + 1):
                code = f"A{index:02d}"
                self.connection.execute(
                    "INSERT INTO students(id,classroom_id,code,created_at) VALUES(?,?,?,?)",
                    (uuid.uuid4().hex, classroom_id, code, created_at),
                )
        return self.get_class(classroom_id)

    def get_class(self, classroom_id: str) -> dict[str, Any]:
        row = self.connection.execute(
            "SELECT id,name,created_at FROM classrooms WHERE id=?", (classroom_id,)
        ).fetchone()
        if not row:
            raise KeyError("La clase no existe.")
        students = self.connection.execute(
            "SELECT id,code,created_at FROM students WHERE classroom_id=? ORDER BY code",
            (classroom_id,),
        ).fetchall()
        return {
            "id": row["id"],
            "name": row["name"],
            "created_at": row["created_at"],
            "students": [dict(item) for item in students],
        }

    def list_classes(self) -> list[dict[str, Any]]:
        rows = self.connection.execute(
            "SELECT id,name,created_at FROM classrooms ORDER BY created_at DESC"
        ).fetchall()
        return [dict(row) for row in rows]

    @staticmethod
    def _validate_questions(questions: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not isinstance(questions, list) or not 1 <= len(questions) <= 160:
            raise ValidationError("El examen necesita entre 1 y 160 preguntas.")
        validated = []
        seen = set()
        for raw in questions:
            question = dict(raw)
            qid = str(question.get("id", "")).strip()
            qtype = str(question.get("type", "")).strip()
            if not qid or qid in seen:
                raise ValidationError("Cada pregunta necesita un identificador único.")
            if qtype not in {"choice", "numeric", "open"}:
                raise ValidationError(f"Tipo de pregunta no válido: {qtype}")
            prompt = str(question.get("prompt", "")).strip()
            if not prompt:
                raise ValidationError(f"La pregunta {qid} no tiene enunciado.")
            points = float(question.get("points", 1))
            if points <= 0:
                raise ValidationError(f"La pregunta {qid} necesita puntuación positiva.")
            if qtype == "choice":
                options = question.get("options")
                answer = str(question.get("answer", ""))
                if not isinstance(options, list) or len(options) != 4 or answer not in LETTERS:
                    raise ValidationError(f"La pregunta {qid} necesita cuatro opciones y clave A–D.")
                question["options"] = [str(option)[:500] for option in options]
            elif qtype == "numeric":
                try:
                    question["answer"] = float(question["answer"])
                except (KeyError, TypeError, ValueError) as exc:
                    raise ValidationError(f"La pregunta {qid} necesita una solución numérica.") from exc
                question["tolerance"] = max(0.0, float(question.get("tolerance", 0)))
            else:
                question["rubric"] = str(question.get("rubric", "")).strip()
                if not question["rubric"]:
                    raise ValidationError(f"La pregunta abierta {qid} necesita rúbrica.")
            question.update({"id": qid, "type": qtype, "prompt": prompt[:2000], "points": points})
            question["skill"] = str(question.get("skill", "Sin clasificar"))[:120]
            validated.append(question)
            seen.add(qid)
        return validated

    def create_exam(
        self,
        classroom_id: str,
        *,
        title: str,
        subject: str,
        version: str,
        questions: list[dict[str, Any]],
    ) -> dict[str, Any]:
        self.get_class(classroom_id)
        title, subject, version = (str(value).strip() for value in (title, subject, version))
        if not all((title, subject, version)):
            raise ValidationError("Título, asignatura y versión son obligatorios.")
        exam_id = uuid.uuid4().hex
        valid_questions = self._validate_questions(questions)
        created_at = utc_now()
        with self.connection:
            self.connection.execute(
                """INSERT INTO exams(id,classroom_id,title,subject,version,questions_json,created_at)
                   VALUES(?,?,?,?,?,?,?)""",
                (exam_id, classroom_id, title[:160], subject[:120], version[:40],
                 json.dumps(valid_questions, ensure_ascii=False), created_at),
            )
        return self.get_exam(exam_id)

    def get_exam(self, exam_id: str) -> dict[str, Any]:
        row = self.connection.execute("SELECT * FROM exams WHERE id=?", (exam_id,)).fetchone()
        if not row:
            raise KeyError("El examen no existe.")
        result = dict(row)
        result["questions"] = json.loads(result.pop("questions_json"))
        return result

    def list_exams(self, classroom_id: str) -> list[dict[str, Any]]:
        self.get_class(classroom_id)
        rows = self.connection.execute(
            "SELECT id,classroom_id,title,subject,version,created_at FROM exams WHERE classroom_id=? ORDER BY created_at DESC",
            (classroom_id,),
        ).fetchall()
        return [dict(row) for row in rows]

    def _student(self, classroom_id: str, code: str) -> sqlite3.Row:
        row = self.connection.execute(
            "SELECT id,code FROM students WHERE classroom_id=? AND code=?",
            (classroom_id, str(code).upper()),
        ).fetchone()
        if not row:
            raise KeyError("El alumno no pertenece a la clase del examen.")
        return row

    def save_attempt(
        self,
        exam_id: str,
        student_code: str,
        answers: dict[str, Any],
        *,
        score: float,
        maximum: float,
        source: str = "manual",
    ) -> dict[str, Any]:
        exam = self.get_exam(exam_id)
        student = self._student(exam["classroom_id"], student_code)
        attempt = {
            "id": uuid.uuid4().hex,
            "exam_id": exam_id,
            "student_id": student["id"],
            "answers": dict(answers),
            "score": float(score),
            "maximum": float(maximum),
            "source": str(source)[:40],
            "created_at": utc_now(),
        }
        if attempt["maximum"] <= 0 or not 0 <= attempt["score"] <= attempt["maximum"]:
            raise ValidationError("La puntuación no es válida.")
        with self.connection:
            self.connection.execute(
                """INSERT INTO attempts(id,exam_id,student_id,answers_json,score,maximum,source,created_at)
                   VALUES(?,?,?,?,?,?,?,?)""",
                (attempt["id"], exam_id, student["id"],
                 json.dumps(attempt["answers"], ensure_ascii=False), attempt["score"],
                 attempt["maximum"], attempt["source"], attempt["created_at"]),
            )
        return attempt

    def student_history(self, classroom_id: str, student_code: str) -> list[dict[str, Any]]:
        student = self._student(classroom_id, student_code)
        rows = self.connection.execute(
            """SELECT a.*, e.title, e.subject, e.version
               FROM attempts a JOIN exams e ON e.id=a.exam_id
               WHERE a.student_id=? ORDER BY a.created_at DESC""",
            (student["id"],),
        ).fetchall()
        history = []
        for row in rows:
            item = dict(row)
            item["answers"] = json.loads(item.pop("answers_json"))
            history.append(item)
        return history


class ExamPdfGenerator:
    def __init__(self, repository: CuadernoRepository):
        self.repository = repository

    @staticmethod
    def qr_payload(exam_id: str, student: str, version: str, page: int) -> str:
        return f"{QR_PREFIX}|{exam_id}|{version}|{student}|{int(page)}"

    @staticmethod
    def parse_qr(payload: str) -> dict[str, Any]:
        parts = payload.split("|")
        if len(parts) != 5 or parts[0] != QR_PREFIX:
            raise ScanError("El QR no pertenece a Cuaderno Vivo.")
        try:
            page = int(parts[4])
        except ValueError as exc:
            raise ScanError("El número de página del QR no es válido.") from exc
        if page < 1:
            raise ScanError("El número de página del QR no es válido.")
        return {"exam_id": parts[1], "version": parts[2], "student": parts[3], "page": page}

    def generate(self, exam_id: str, output_path: str | Path) -> dict[str, Any]:
        exam = self.repository.get_exam(exam_id)
        classroom = self.repository.get_class(exam["classroom_id"])
        output = Path(output_path)
        output.parent.mkdir(parents=True, exist_ok=True)
        pdf = canvas.Canvas(str(output), pagesize=A4, pageCompression=1)
        width, height = A4
        manifest = {"exam_id": exam_id, "output": str(output), "pages": []}
        for student in classroom["students"]:
            payload = self.qr_payload(exam_id, student["code"], exam["version"], 1)
            qr = qrcode.make(payload).convert("RGB")
            buffer = io.BytesIO()
            qr.save(buffer, format="PNG")
            buffer.seek(0)
            pdf.setTitle(exam["title"])
            scale_x = width / CANONICAL_WIDTH
            scale_y = height / CANONICAL_HEIGHT
            x_pt = lambda value: value * scale_x
            y_pt = lambda value: height - value * scale_y
            radius = 28 * min(scale_x, scale_y)

            # Cuatro referencias sólidas: permiten corregir perspectiva antes de leer OMR.
            pdf.setFillColorRGB(0, 0, 0)
            for marker_x, marker_y in ((60, 60), (1140, 60), (60, 1540), (1140, 1540)):
                pdf.rect(x_pt(marker_x - 30), y_pt(marker_y + 30), x_pt(60), 60 * scale_y, stroke=0, fill=1)

            pdf.drawImage(
                ImageReader(buffer), x_pt(100), y_pt(360), x_pt(260), 260 * scale_y,
                preserveAspectRatio=True, mask="auto",
            )
            pdf.setFont("Helvetica-Bold", 14)
            pdf.drawString(x_pt(410), y_pt(125), exam["title"][:65])
            pdf.setFont("Helvetica", 8)
            pdf.drawString(
                x_pt(410), y_pt(170),
                f"{exam['subject']} · Versión {exam['version']} · Alumno {student['code']} · Página 1",
            )
            pdf.drawString(x_pt(410), y_pt(205), "Marca una sola respuesta por pregunta. No escribas datos personales.")
            pdf.setFont("Helvetica", 7)
            pdf.drawString(x_pt(410), y_pt(245), "QR seudónimo: examen, versión, alumno y página")

            for index, question in enumerate(exam["questions"][:8]):
                canonical_y = OMR_Y0 + index * OMR_ROW_GAP
                pdf.setFont("Helvetica-Bold", 7)
                pdf.drawString(x_pt(120), y_pt(canonical_y - 42), f"{index + 1}. {question['prompt'][:118]}")
                options = question.get("options", [])
                if question["type"] == "choice":
                    for column, letter in enumerate(LETTERS):
                        canonical_x = OMR_XS[column]
                        pdf.circle(x_pt(canonical_x), y_pt(canonical_y), radius, stroke=1, fill=0)
                        pdf.setFont("Helvetica", 6)
                        option = options[column][:28]
                        pdf.drawCentredString(x_pt(canonical_x), y_pt(canonical_y + 47), f"{letter}. {option}")
                else:
                    pdf.line(x_pt(120), y_pt(canonical_y + 15), x_pt(1080), y_pt(canonical_y + 15))
            pdf.setFont("Helvetica", 6)
            pdf.drawCentredString(width / 2, y_pt(1480), "Cuaderno Vivo · plantilla controlada · conserva visibles las cuatro referencias negras")
            pdf.showPage()
            manifest["pages"].append({"student": student["code"], "page": 1, "qr": payload})
        pdf.save()
        return manifest


class OmrScanner:
    def __init__(self, repository: CuadernoRepository):
        self.repository = repository
        self.qr_detector = cv2.QRCodeDetector()

    @staticmethod
    def _order_markers(points: list[tuple[float, float]]) -> np.ndarray:
        array = np.array(points, dtype=np.float32)
        sums = array.sum(axis=1)
        differences = np.diff(array, axis=1).reshape(-1)
        return np.array([
            array[np.argmin(sums)],
            array[np.argmin(differences)],
            array[np.argmax(sums)],
            array[np.argmax(differences)],
        ], dtype=np.float32)

    def _normalize(self, image: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        _, binary = cv2.threshold(gray, 80, 255, cv2.THRESH_BINARY_INV)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        height, width = gray.shape
        corners = [(0, 0), (width, 0), (width, height), (0, height)]
        selected = []
        for target_x, target_y in corners:
            candidates = []
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                area = w * h
                if 1000 <= area <= max(15000, width * height * 0.02) and 0.65 <= w / max(h, 1) <= 1.35:
                    center = (x + w / 2, y + h / 2)
                    distance = (center[0] - target_x) ** 2 + (center[1] - target_y) ** 2
                    candidates.append((distance, center))
            if not candidates:
                raise ScanError("No se reconocen las cuatro referencias de la página. Repite la fotografía completa.")
            selected.append(min(candidates, key=lambda item: item[0])[1])
        ordered = self._order_markers(selected)
        destination = np.array([[60, 60], [1140, 60], [1140, 1540], [60, 1540]], dtype=np.float32)
        transform = cv2.getPerspectiveTransform(ordered, destination)
        return cv2.warpPerspective(image, transform, (CANONICAL_WIDTH, CANONICAL_HEIGHT))

    @staticmethod
    def _read_answers(image: np.ndarray, questions: list[dict[str, Any]]) -> tuple[dict[str, Any], list[str]]:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        answers: dict[str, Any] = {}
        review = []
        choice_questions = [question for question in questions if question["type"] == "choice"][:8]
        for row, question in enumerate(choice_questions):
            y = OMR_Y0 + row * OMR_ROW_GAP
            ratios = []
            for x in OMR_XS:
                yy, xx = np.ogrid[-20:21, -20:21]
                mask = xx * xx + yy * yy <= 18 * 18
                crop = gray[y - 20:y + 21, x - 20:x + 21]
                if crop.shape != (41, 41):
                    raise ScanError("La zona de respuestas está incompleta. Repite la fotografía.")
                ratios.append(float(np.mean(crop[mask] < 100)))
            marked = [index for index, ratio in enumerate(ratios) if ratio >= 0.35]
            if len(marked) == 1:
                answers[question["id"]] = LETTERS[marked[0]]
            else:
                answers[question["id"]] = None
                review.append(question["id"])
        return answers, review

    def process_and_grade(self, image_path: str | Path) -> dict[str, Any]:
        image = cv2.imread(str(image_path))
        if image is None or image.shape[0] < 600 or image.shape[1] < 450:
            raise ScanError("La fotografía es ilegible o demasiado pequeña.")
        normalized = self._normalize(image)
        payload, _, _ = self.qr_detector.detectAndDecode(normalized)
        if not payload:
            payload, _, _ = self.qr_detector.detectAndDecode(image)
        if not payload:
            raise ScanError("No se puede leer el QR. Repite la fotografía con mejor luz y enfoque.")
        identity = ExamPdfGenerator.parse_qr(payload)
        exam = self.repository.get_exam(identity["exam_id"])
        if identity["version"] != exam["version"]:
            raise ScanError("La página pertenece a otra versión del examen.")
        self.repository._student(exam["classroom_id"], identity["student"])
        answers, review = self._read_answers(normalized, exam["questions"])
        maximum = sum(float(q["points"]) for q in exam["questions"] if q["type"] == "choice")
        score = sum(
            float(question["points"])
            for question in exam["questions"]
            if question["type"] == "choice" and answers.get(question["id"]) == question["answer"]
        )
        result = {
            "class_id": exam["classroom_id"],
            "exam_id": exam["id"],
            "student": identity["student"],
            "version": identity["version"],
            "page": identity["page"],
            "answers": answers,
            "score": score,
            "maximum": maximum,
            "needs_review": bool(review),
            "review_questions": review,
            "qr": payload,
        }
        if not review:
            self.repository.save_attempt(
                exam["id"], identity["student"], answers,
                score=score, maximum=maximum, source="paper-scan",
            )
        return result
