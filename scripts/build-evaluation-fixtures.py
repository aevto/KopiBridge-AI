"""Create labelled synthetic fixtures, never participant or employment evidence."""
import json
import math
import subprocess
import wave
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "tests/fixtures/multimodal"
OUT.mkdir(parents=True, exist_ok=True)
font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 25)
bold = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 30)
lines = [
    "EARLY CAREER SOFTWARE DEVELOPER",
    "EDUCATION", "BSc Computer Science, expected 2026",
    "SKILLS", "Python, JavaScript, React, SQL, Git",
    "PROJECTS", "Built a Flask API for a campus events application.",
    "Added input validation and two unit tests with pytest.",
    "Stored event records in SQLite and documented setup.",
    "Created a React interface for searching campus events.",
    "EXPERIENCE", "Presented the project to a class of students.",
    "Worked with two classmates using Git branches.",
    "No Docker, cloud deployment, or RAG project yet.",
]
records = []
for name in ["clean", "columns", "low-contrast"]:
    image = Image.new("RGB", (1500, 1700), "white")
    draw = ImageDraw.Draw(image)
    for i, line in enumerate(lines):
        x, y = 80, 90 + i * 82
        if name == "columns" and i >= 6: x, y = 620, 260 + (i - 6) * 110
        if name == "columns" and i < 6: x, y = 60, 90 + i * 80
        draw.text((x, y), line, font=bold if i in (0,1,3,5,10) else font, fill="#292724")
    if name == "low-contrast": image = ImageEnhance.Contrast(image).enhance(0.25)
    image.save(OUT / f"resume-{name}.png")
    records.append({"id": name, "image": f"resume-{name}.png", "reference": "\n".join(lines)})
Image.new("RGB", (1000, 1200), "white").save(OUT / "blank.png")
pdf = canvas.Canvas(str(OUT / "resume-text.pdf"))
for i, line in enumerate(lines): pdf.drawString(35, 800 - i * 35, line)
pdf.save()
scan = canvas.Canvas(str(OUT / "resume-scanned.pdf"))
scan.drawImage(str(OUT / "resume-clean.png"), 0, 0, width=595, height=842)
scan.save()
answers = [
    {"id":"specific", "text":"I built a Flask API for campus events. I added input validation and two unit tests using pytest. The events were stored in SQLite. I worked with two classmates using Git branches. I have not deployed the project to a cloud platform yet. I would prepare the repository and test results to explain my contribution."},
    {"id":"unsupported", "text":"I built a Flask application for campus events. I would like to learn Docker and cloud deployment next. I have not used either in a completed project, so I cannot claim that experience. My next step is to containerise the application, test the local setup, and document the commands."},
    {"id":"noisy", "text":"I created a React interface for searching campus events. My role was building the search form and connecting it to our Flask API. I can show the repository and explain the request validation. We did not measure performance, so I would not claim a speed improvement."},
]
for answer in answers:
    aiff = OUT / f"{answer['id']}.aiff"
    raw = OUT / f"{answer['id']}.pcm"
    subprocess.run(["say", "-v", "Samantha", "-r", "165", "-o", str(aiff), answer["text"]], check=True)
    subprocess.run(["/opt/homebrew/bin/ffmpeg", "-y", "-loglevel", "error", "-i", str(aiff), "-ac", "1", "-ar", "16000", "-f", "s16le", str(raw)], check=True)
    data = raw.read_bytes()
    if answer["id"] == "noisy":
        import array, random
        random.seed(41)
        samples = array.array("h", data)
        for i, value in enumerate(samples): samples[i] = max(-32768, min(32767, value + int(random.gauss(0, 500))))
        data = samples.tobytes()
    with wave.open(str(OUT / f"answer-{answer['id']}.wav"), "wb") as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(16000); f.writeframes(data)
    aiff.unlink(); raw.unlink()
    answer["audio"] = f"answer-{answer['id']}.wav"
    answer["origin"] = "Synthetic text spoken by macOS Samantha; not a human participant."
(OUT / "manifest.json").write_text(json.dumps({"origin":"Purpose-written synthetic resume and interview fixtures", "images":records, "answers":answers}, indent=2))
print(f"Created {len(records)} resume images, two PDFs, and {len(answers)} synthetic speech clips.")
