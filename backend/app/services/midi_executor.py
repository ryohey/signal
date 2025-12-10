import subprocess
import tempfile
import base64
from pathlib import Path
from typing import Dict


class MIDIExecutionError(Exception):
    pass


ALLOWED_IMPORTS = {"midiutil", "os", "random", "math"}


def validate_code(code: str) -> bool:
    """Validate that code is syntactically correct and uses allowed imports."""
    # Check syntax by trying to compile
    try:
        compile(code, "<generated>", "exec")
    except SyntaxError as e:
        raise MIDIExecutionError(
            f"Generated code has syntax error: {e.msg} at line {e.lineno}. "
            "This is a code generation issue - please try again."
        )

    # Check imports
    lines = code.split("\n")
    for line in lines:
        line = line.strip()
        if line.startswith("import ") or line.startswith("from "):
            # Extract module name
            if line.startswith("import "):
                module = line.split()[1].split(".")[0]
            else:
                module = line.split()[1].split(".")[0]

            if module not in ALLOWED_IMPORTS:
                raise MIDIExecutionError(f"Disallowed import: {module}")
    return True


def execute_midi_generation(
    code: str, tempo: int = 120, key: str = "Am"
) -> Dict[str, bytes]:
    """Execute generated Python code in a sandbox and return MIDI files."""

    validate_code(code)

    with tempfile.TemporaryDirectory() as tmpdir:
        # Replace placeholders in code
        code = code.replace("{output_dir}", tmpdir)
        code = code.replace("{tempo}", str(tempo))
        code = code.replace("{key}", key)

        code_file = Path(tmpdir) / "generate.py"
        code_file.write_text(code)

        # Execute with timeout
        try:
            result = subprocess.run(
                ["python", str(code_file)],
                capture_output=True,
                timeout=30,
                cwd=tmpdir,
                text=True,
            )
        except subprocess.TimeoutExpired:
            raise MIDIExecutionError("Code execution timed out (30s limit)")

        if result.returncode != 0:
            # Extract useful error info
            stderr = result.stderr
            if "IndexError: pop from empty list" in stderr:
                raise MIDIExecutionError(
                    "MIDI generation failed due to overlapping notes. "
                    "This is a code generation issue - please try again."
                )
            raise MIDIExecutionError(f"Code execution failed: {stderr}")

        # Collect generated MIDI files
        midi_files = {}
        for midi_path in Path(tmpdir).glob("*.mid"):
            midi_files[midi_path.stem] = midi_path.read_bytes()

        if not midi_files:
            raise MIDIExecutionError("No MIDI files were generated")

        return midi_files


def midi_to_base64(midi_bytes: bytes) -> str:
    """Convert MIDI bytes to base64 string."""
    return base64.b64encode(midi_bytes).decode("utf-8")
