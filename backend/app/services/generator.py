"""Deep agent generation pipeline with validation and refinement."""

import logging
from typing import Dict, List, Callable, Optional, Any
from app.models.schemas import SongSpec, ValidationResult, AttemptLog
from app.services.llm import (
    generate_song_spec,
    generate_midi_code_from_spec,
    generate_refined_code,
)
from app.services.midi_executor import execute_midi_generation, MIDIExecutionError
from app.services.validator import validate_midi_output

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Configuration
MAX_ATTEMPTS = 5
PATCH_ATTEMPTS = 3  # First 3 attempts use patch mode, then regenerate


class GenerationError(Exception):
    """Raised when generation fails after max attempts."""

    def __init__(self, message: str, attempt_logs: List[AttemptLog]):
        super().__init__(message)
        self.attempt_logs = attempt_logs


async def generate_song_deep(
    prompt: str,
    tempo: int = 120,
    key: str = "Am",
    progress_callback: Optional[Callable[[str, Dict[str, Any]], None]] = None,
) -> Dict[str, Any]:
    """
    Generate a song using the deep agent architecture:
    1. Planning: Create structured song spec
    2. Generation: Generate MIDI code from spec
    3. Validation: Check quality metrics
    4. Refinement: Fix issues via patch or regenerate

    Args:
        prompt: User's music description
        tempo: Base tempo (may be adjusted by planner)
        key: Base key (may be adjusted by planner)
        on_progress: Optional callback for progress updates

    Returns:
        Dict with midi_files, spec, validation_result, attempt_logs

    Raises:
        GenerationError: If generation fails after max attempts
    """

    async def progress(stage: str, data: Optional[Dict[str, Any]] = None):
        if progress_callback:
            await progress_callback(stage, data or {})

    attempt_logs: List[AttemptLog] = []

    logger.info("=" * 60)
    logger.info(f"DEEP GENERATION START: prompt='{prompt[:50]}...', tempo={tempo}, key={key}")
    logger.info("=" * 60)

    # Stage 1: Planning
    await progress("planning", {"message": "Creating song specification..."})
    logger.info("Stage 1: PLANNING - Creating song specification...")

    try:
        spec = await generate_song_spec(prompt, tempo, key)
        logger.info(f"Planning complete: {len(spec.instruments)} instruments, {spec.total_bars} bars")
        logger.debug(f"Instruments: {[i.name for i in spec.instruments]}")
        logger.debug(f"Structure: {[(s.type.value, s.bars) for s in spec.structure]}")
        await progress("planning_complete", {
            "message": f"Planned {len(spec.instruments)} instruments, {spec.total_bars} bars",
            "spec": spec.model_dump(),
        })
    except Exception as e:
        logger.error(f"Planning FAILED: {str(e)}")
        raise GenerationError(f"Planning failed: {str(e)}", attempt_logs)

    # Stage 2-4: Generation loop with validation and refinement
    previous_code: Optional[str] = None
    last_validation: Optional[ValidationResult] = None

    for attempt in range(1, MAX_ATTEMPTS + 1):
        mode = "patch" if attempt <= PATCH_ATTEMPTS and previous_code else "regenerate"
        if attempt == 1:
            mode = "initial"

        logger.info("-" * 40)
        logger.info(f"ATTEMPT {attempt}/{MAX_ATTEMPTS} (mode={mode})")
        logger.info("-" * 40)

        await progress("generating", {
            "attempt": attempt,
            "mode": mode,
            "message": f"Attempt {attempt}/{MAX_ATTEMPTS}: {'Generating' if mode != 'patch' else 'Patching'} code...",
        })

        # Generate or refine code
        try:
            logger.info(f"Calling LLM for code generation (mode={mode})...")
            if mode == "initial":
                code = await generate_midi_code_from_spec(spec)
            else:
                code = await generate_refined_code(
                    spec, previous_code, last_validation, mode=mode
                )
            logger.info(f"Code generated: {len(code)} characters")
            logger.debug(f"Code preview: {code[:200]}...")
        except Exception as e:
            logger.error(f"Code generation FAILED: {str(e)}")
            attempt_logs.append(AttemptLog(
                attempt=attempt,
                mode=mode,
                code_generated=False,
                execution_success=False,
                validation_passed=False,
                error=f"Code generation failed: {str(e)}",
            ))
            continue

        # Execute the generated code
        await progress("executing", {
            "attempt": attempt,
            "message": "Running MIDI generation code...",
        })

        logger.info("Executing generated code...")
        try:
            midi_files = execute_midi_generation(code, spec.tempo, spec.key)
            logger.info(f"Execution SUCCESS: Generated {len(midi_files)} MIDI files")
            logger.info(f"Files: {list(midi_files.keys())}")
        except MIDIExecutionError as e:
            logger.error(f"Execution FAILED: {str(e)}")
            attempt_logs.append(AttemptLog(
                attempt=attempt,
                mode=mode,
                code_generated=True,
                execution_success=False,
                validation_passed=False,
                error=f"Execution failed: {str(e)}",
            ))
            previous_code = code
            # Create a mock validation result for refinement
            last_validation = ValidationResult(
                passed=False,
                overall_score=0.0,
                track_metrics=[],
                issues=[f"Code execution error: {str(e)}"],
                suggestions=["Fix syntax errors in the generated code"],
            )
            continue

        if not midi_files:
            logger.warning("No MIDI files generated")
            attempt_logs.append(AttemptLog(
                attempt=attempt,
                mode=mode,
                code_generated=True,
                execution_success=False,
                validation_passed=False,
                error="No MIDI files generated",
            ))
            previous_code = code
            last_validation = ValidationResult(
                passed=False,
                overall_score=0.0,
                track_metrics=[],
                issues=["No MIDI files were created"],
                suggestions=["Ensure code calls generate_song() with correct output directory"],
            )
            continue

        # Validate the output
        await progress("validating", {
            "attempt": attempt,
            "message": f"Validating {len(midi_files)} tracks...",
        })

        logger.info(f"Validating {len(midi_files)} tracks...")
        try:
            # Skip LLM review on intermediate attempts to speed up iteration
            validation = await validate_midi_output(
                midi_files, spec, prompt, skip_llm_review=(attempt < MAX_ATTEMPTS)
            )
            logger.info(f"Validation complete: passed={validation.passed}, score={validation.overall_score:.1%}")
            if validation.issues:
                logger.info(f"Validation issues:")
                for issue in validation.issues:
                    logger.info(f"  - {issue}")
            if validation.track_metrics:
                logger.debug("Track metrics:")
                for m in validation.track_metrics:
                    logger.debug(f"  {m.name}: {m.note_count} notes, vel {m.velocity_min}-{m.velocity_max} (std={m.velocity_std:.1f}), {m.eighth_note_or_faster_pct:.0f}% eighth+, sync={m.syncopation_score:.2f}")
        except Exception as e:
            logger.error(f"Validation FAILED: {str(e)}")
            attempt_logs.append(AttemptLog(
                attempt=attempt,
                mode=mode,
                code_generated=True,
                execution_success=True,
                validation_passed=False,
                error=f"Validation error: {str(e)}",
            ))
            previous_code = code
            continue

        # Log this attempt
        attempt_logs.append(AttemptLog(
            attempt=attempt,
            mode=mode,
            code_generated=True,
            execution_success=True,
            validation_passed=validation.passed,
            validation_result=validation,
            issues=validation.issues,
        ))

        await progress("validated", {
            "attempt": attempt,
            "passed": validation.passed,
            "score": validation.overall_score,
            "issues": validation.issues,
            "message": f"Validation: {'PASSED' if validation.passed else 'FAILED'} (score: {validation.overall_score:.1%})",
        })

        if validation.passed:
            # Success!
            logger.info("=" * 60)
            logger.info(f"GENERATION SUCCESS after {attempt} attempt(s)")
            logger.info("=" * 60)
            await progress("complete", {
                "attempt": attempt,
                "message": f"Generation complete after {attempt} attempt(s)",
            })

            return {
                "midi_files": midi_files,
                "spec": spec,
                "validation_result": validation,
                "attempt_logs": attempt_logs,
            }

        # Prepare for next attempt
        logger.info(f"Validation failed, preparing for next attempt...")
        previous_code = code
        last_validation = validation

    # All attempts failed
    logger.error("=" * 60)
    logger.error(f"GENERATION FAILED after {MAX_ATTEMPTS} attempts")
    logger.error(f"Final issues: {last_validation.issues if last_validation else 'Unknown'}")
    logger.error("=" * 60)

    await progress("failed", {
        "message": f"Generation failed after {MAX_ATTEMPTS} attempts",
        "attempt_logs": [log.model_dump() for log in attempt_logs],
    })

    raise GenerationError(
        f"Generation failed after {MAX_ATTEMPTS} attempts. Issues: {last_validation.issues if last_validation else 'Unknown'}",
        attempt_logs,
    )
