"""Hybrid agent service - runs LLM reasoning on backend, tools execute on frontend.

Uses DeepAgents with interrupt_before to pause before tool execution,
returning tool calls to the frontend for execution against the MobX store.
"""

import uuid
from typing import Any, Optional
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent
from langgraph.types import Command
from app.config import get_settings

settings = get_settings()

# Initialize LLM
model = ChatOpenAI(
    model=settings.openrouter_model,
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.openrouter_api_key,
    default_headers={
        "HTTP-Referer": "https://github.com/signal-music-composer",
        "X-Title": "AI Music Composer",
    },
    temperature=0.7,
    max_tokens=4096,
)

# In-memory checkpointer for session persistence
# In production, use SqliteSaver or PostgresSaver
checkpointer = MemorySaver()

# System prompt for the hybrid agent
HYBRID_SYSTEM_PROMPT = """You are a music composition assistant that creates and edits MIDI compositions by calling tools.

AVAILABLE TOOLS:

Creation Tools:
- createTrack: Create a new track with an instrument
- addNotes: Add notes to an existing track
- setTempo: Set the tempo in BPM
- setTimeSignature: Set the time signature

Note Editing Tools:
- deleteNotes: Remove notes by their IDs
- updateNotes: Modify note properties (pitch, timing, duration, velocity)
- transposeNotes: Shift notes up/down by semitones
- duplicateNotes: Copy notes with optional time offset
- quantizeNotes: Snap notes to a grid

Track Operation Tools:
- deleteTrack: Remove a track from the song
- renameTrack: Change a track's name
- setTrackInstrument: Change a track's instrument
- setTrackVolume: Set track volume (0-127)
- setTrackPan: Set stereo pan position (0=left, 64=center, 127=right)

Advanced Controller Tools:
- setController: Set any MIDI CC value (sustain pedal, modulation, reverb, etc.)
- setPitchBend: Set pitch bend (0-16383, center=8192)

IMPORTANT: When calling tools, you must use the exact parameter names and formats specified.

SONG STATE CONTEXT:
You will receive the current song state before each request. This tells you:
- Current tempo and time signature
- Existing tracks with their IDs, instruments, channels, and note counts
- Track [0] is usually the conductor track (tempo/time signature only)

The song state also includes note IDs that you can use for editing operations.

Use this context to:
- Reference existing tracks by their ID when adding or editing notes
- Reference note IDs when editing, deleting, transposing, or duplicating notes
- Avoid creating duplicate tracks (e.g., if a piano track exists, use it)
- Understand what's already in the song before making changes

Example context:
```
Current song state:
- Tempo: 120 BPM
- Time signature: 4/4
- Tracks: 2

Track details:
  [0] Conductor track (tempo/time signature)
  [1] Acoustic Grand Piano - channel 0, 16 notes
    Notes: [id:5 C4@0], [id:6 E4@480], [id:7 G4@960]...
```

MIDI REFERENCE:
- Note numbers: Middle C = 60, each semitone = +1 (C4=60, D4=62, E4=64, F4=65, G4=67, A4=69, B4=71)
- Timing: 480 ticks = 1 quarter note
- Durations: whole=1920, half=960, quarter=480, eighth=240, sixteenth=120
- Velocity: 1-127 (loudness), typical range 60-100
- Common scales from C: Major [60,62,64,65,67,69,71,72], Minor [60,62,63,65,67,68,70,72]
- Quantize grid sizes: 480 (quarter), 240 (eighth), 120 (sixteenth), 60 (32nd)

CONTROLLER REFERENCE (for setController):
- "modulation" (CC1): Vibrato/tremolo depth, 0-127
- "volume" (CC7): Track volume, 0-127
- "pan" (CC10): Stereo position, 0=left, 64=center, 127=right
- "expression" (CC11): Dynamic expression, 0-127
- "sustain" (CC64): Sustain pedal, 0=off, 64+=on
- "reverb" (CC91): Reverb depth, 0-127
- "chorus" (CC93): Chorus depth, 0-127
- "brightness" (CC74): Filter cutoff, 0-127
- "attack" (CC73): Attack time, 0-127
- "release" (CC72): Release time, 0-127
Or use any CC number directly: "CC1", "CC64", "7", etc.

WORKFLOW:
1. Check the song state to see what exists
2. For simple, clear requests (e.g., "add a piano track", "transpose up an octave"), execute tools directly
3. For complex or ambiguous requests, discuss with the user first via your response message
4. When editing notes, always reference the note IDs from the song state
5. Use editing tools to refine existing music rather than recreating from scratch
6. Only set tempo/time signature if needed (check current values first)
7. Reuse existing tracks when appropriate instead of creating new ones

EDITING TIPS:
- To change wrong notes: use updateNotes to fix pitch, or deleteNotes + addNotes
- To shift timing: use updateNotes with new tick values
- To make louder/softer: use updateNotes to change velocity
- To move to different octave: use transposeNotes with semitones=12 or -12
- To extend/repeat a phrase: use duplicateNotes
- To fix timing issues: use quantizeNotes with appropriate grid size

CONTROLLER TIPS:
- For piano sustain: setController with "sustain", value=127 (on) or 0 (off)
- For vibrato: setController with "modulation", value 0-127
- For pitch slides: use setPitchBend at different ticks (8192=center, 0=down, 16383=up)
- Controllers can change over time: call setController at different tick positions

IMPORTANT - CONVERSATION MEMORY:
- This is a multi-turn conversation. ALWAYS remember what the user told you earlier.
- If the user mentioned a style, genre, key, tempo preference, or any other detail earlier in the conversation, REMEMBER IT and apply it to all subsequent actions.
- NEVER ask the user to repeat information they already provided. If they said "rock song" or "jazz style" earlier, that context applies to the whole session.
- Reference earlier conversation when relevant: "Based on the rock style you mentioned..."

Be concise in your responses. Focus on helping the user create great music."""


# Tool definitions that match the frontend schemas
# These are "dummy" tools - they just return a placeholder since actual execution happens on frontend

@tool
def createTrack(instrumentName: str, trackName: Optional[str] = None) -> str:
    """Creates a new MIDI track with the specified instrument.

    Args:
        instrumentName: The instrument to use. GM names like "Acoustic Grand Piano" or aliases like "piano", "guitar", "drums", "bass"
        trackName: Optional custom name for the track. Defaults to the instrument name.

    Returns:
        JSON with trackId, instrumentName, programNumber, channel, isDrums
    """
    # This will be intercepted - actual execution on frontend
    return '{"trackId": 1, "status": "pending_frontend_execution"}'


@tool
def addNotes(trackId: int, notes: list[dict]) -> str:
    """Adds notes to an existing track.

    Args:
        trackId: The track ID returned from createTrack
        notes: Array of notes, each with: pitch (0-127, middle C=60), start (ticks, 480=quarter), duration (ticks), velocity (1-127, optional, default 100)

    Returns:
        JSON with trackId and noteCount
    """
    return '{"status": "pending_frontend_execution"}'


@tool
def setTempo(bpm: int, tick: int = 0) -> str:
    """Sets the tempo (BPM) at a specific position in the song.

    Args:
        bpm: Beats per minute (20-300). Common: Andante 76-108, Moderato 108-120, Allegro 120-168
        tick: Position in ticks where tempo takes effect. Default: 0 (start)

    Returns:
        JSON with bpm and tick
    """
    return '{"status": "pending_frontend_execution"}'


@tool
def setTimeSignature(numerator: int, denominator: int, tick: int = 0) -> str:
    """Sets the time signature at a specific position.

    Args:
        numerator: Beats per measure (1-16). Common: 4 for 4/4, 3 for 3/4
        denominator: Beat unit: 2=half, 4=quarter, 8=eighth, 16=sixteenth
        tick: Position in ticks where time signature takes effect. Default: 0

    Returns:
        JSON with numerator, denominator, and tick
    """
    return '{"status": "pending_frontend_execution"}'


# ============================================================================
# NOTE EDITING TOOLS
# ============================================================================

@tool
def deleteNotes(trackId: int, noteIds: list[int]) -> str:
    """Deletes notes from a track by their IDs.

    Args:
        trackId: The track ID containing the notes
        noteIds: Array of note IDs to delete

    Returns:
        JSON with trackId and deletedCount
    """
    return '{"status": "pending_frontend_execution"}'


@tool
def updateNotes(trackId: int, updates: list[dict]) -> str:
    """Updates properties of existing notes.

    Args:
        trackId: The track ID containing the notes
        updates: Array of update objects, each with: id (required), and optional: pitch (0-127), tick (position), duration (ticks), velocity (1-127)

    Returns:
        JSON with trackId and updatedCount
    """
    return '{"status": "pending_frontend_execution"}'


@tool
def transposeNotes(trackId: int, noteIds: list[int], semitones: int) -> str:
    """Transposes notes by a number of semitones.

    Args:
        trackId: The track ID containing the notes
        noteIds: Array of note IDs to transpose
        semitones: Number of semitones to transpose (positive = up, negative = down). Range: -127 to 127

    Returns:
        JSON with trackId, transposedCount, and semitones
    """
    return '{"status": "pending_frontend_execution"}'


@tool
def duplicateNotes(trackId: int, noteIds: list[int], offsetTicks: int = 0) -> str:
    """Duplicates notes with an optional time offset.

    Args:
        trackId: The track ID containing the notes
        noteIds: Array of note IDs to duplicate
        offsetTicks: Tick offset for the duplicated notes. Default 0 places them immediately after the originals.

    Returns:
        JSON with trackId, duplicatedCount, newNoteIds, and actualOffset
    """
    return '{"status": "pending_frontend_execution"}'


@tool
def quantizeNotes(trackId: int, noteIds: list[int], gridSize: int) -> str:
    """Quantizes notes to snap to a grid.

    Args:
        trackId: The track ID containing the notes
        noteIds: Array of note IDs to quantize
        gridSize: Grid size in ticks. Common values: 480 (quarter), 240 (eighth), 120 (sixteenth), 60 (32nd)

    Returns:
        JSON with trackId and quantizedCount
    """
    return '{"status": "pending_frontend_execution"}'


# ============================================================================
# TRACK OPERATION TOOLS
# ============================================================================

@tool
def deleteTrack(trackId: int) -> str:
    """Deletes a track from the song.

    Args:
        trackId: The track ID to delete. Cannot delete the conductor track (track 0).

    Returns:
        JSON with deletedTrackId and success status
    """
    return '{"status": "pending_frontend_execution"}'


@tool
def renameTrack(trackId: int, name: str) -> str:
    """Renames a track.

    Args:
        trackId: The track ID to rename
        name: The new name for the track

    Returns:
        JSON with trackId and newName
    """
    return '{"status": "pending_frontend_execution"}'


@tool
def setTrackInstrument(trackId: int, instrumentName: str) -> str:
    """Changes the instrument of a track.

    Args:
        trackId: The track ID to modify
        instrumentName: The instrument to use. GM names like "Acoustic Grand Piano" or aliases like "piano", "guitar", "strings"

    Returns:
        JSON with trackId, instrumentName, and programNumber
    """
    return '{"status": "pending_frontend_execution"}'


@tool
def setTrackVolume(trackId: int, volume: int, tick: int = 0) -> str:
    """Sets the volume of a track.

    Args:
        trackId: The track ID to modify
        volume: Volume level 0-127 (0 = silent, 127 = max). Typical range: 80-100
        tick: Position in ticks where volume takes effect. Default: 0 (start)

    Returns:
        JSON with trackId, volume, and tick
    """
    return '{"status": "pending_frontend_execution"}'


@tool
def setTrackPan(trackId: int, pan: int, tick: int = 0) -> str:
    """Sets the stereo pan position of a track.

    Args:
        trackId: The track ID to modify
        pan: Pan position 0-127 (0 = full left, 64 = center, 127 = full right)
        tick: Position in ticks where pan takes effect. Default: 0 (start)

    Returns:
        JSON with trackId, pan, and tick
    """
    return '{"status": "pending_frontend_execution"}'


# ============================================================================
# ADVANCED CONTROLLER TOOLS
# ============================================================================

@tool
def setController(trackId: int, controllerType: str, value: int, tick: int = 0) -> str:
    """Sets any MIDI controller (CC) value on a track.

    This is a generic tool for all 128 MIDI CC controllers. Use friendly names
    or CC numbers directly.

    Args:
        trackId: The track ID to modify
        controllerType: Controller name or CC number. Common names:
            - "modulation" or "mod" (CC1) - vibrato/modulation depth
            - "breath" (CC2) - breath controller
            - "foot" (CC4) - foot controller
            - "volume" (CC7) - main volume
            - "pan" (CC10) - stereo position
            - "expression" (CC11) - dynamic expression
            - "sustain" or "hold" (CC64) - sustain pedal (0=off, 64+=on)
            - "soft" (CC67) - soft pedal
            - "reverb" (CC91) - reverb depth
            - "chorus" (CC93) - chorus depth
            - "brightness" (CC74) - filter cutoff
            - "attack" (CC73) - attack time
            - "release" (CC72) - release time
            Or use CC numbers: "CC1", "CC64", "7", etc.
        value: Controller value 0-127
        tick: Position in ticks where controller takes effect. Default: 0

    Returns:
        JSON with trackId, controllerType, controllerNumber, value, and tick
    """
    return '{"status": "pending_frontend_execution"}'


@tool
def setPitchBend(trackId: int, value: int, tick: int = 0) -> str:
    """Sets pitch bend on a track.

    Pitch bend allows smooth pitch changes between notes. The range is 14-bit
    for fine control.

    Args:
        trackId: The track ID to modify
        value: Pitch bend value 0-16383. Center (no bend) = 8192.
            - 0 = maximum downward bend (typically -2 semitones)
            - 8192 = center/no bend
            - 16383 = maximum upward bend (typically +2 semitones)
        tick: Position in ticks where pitch bend takes effect. Default: 0

    Returns:
        JSON with trackId, value, and tick
    """
    return '{"status": "pending_frontend_execution"}'


# All available tools
TOOLS = [
    # Creation tools
    createTrack,
    addNotes,
    setTempo,
    setTimeSignature,
    # Note editing tools
    deleteNotes,
    updateNotes,
    transposeNotes,
    duplicateNotes,
    quantizeNotes,
    # Track operation tools
    deleteTrack,
    renameTrack,
    setTrackInstrument,
    setTrackVolume,
    setTrackPan,
    # Advanced controller tools
    setController,
    setPitchBend,
]


def create_agent():
    """Create the hybrid agent with interrupt_before for tool execution."""
    agent = create_react_agent(
        model=model,
        tools=TOOLS,
        checkpointer=checkpointer,
        interrupt_before=["tools"],  # Pause before executing tools
        prompt=HYBRID_SYSTEM_PROMPT,
    )
    return agent


# Singleton agent instance
_agent = None


def get_agent():
    """Get or create the singleton agent instance."""
    global _agent
    if _agent is None:
        _agent = create_agent()
    return _agent


def generate_thread_id() -> str:
    """Generate a new thread ID for a session."""
    return str(uuid.uuid4())


async def start_agent_step(prompt: str, thread_id: Optional[str] = None, context: Optional[str] = None) -> dict:
    """Start a new agent interaction or continue an existing one.

    Args:
        prompt: The user's request
        thread_id: Optional existing thread ID to continue. If None, creates new session.
        context: Optional song state context to prepend to the prompt.

    Returns:
        dict with:
        - thread_id: Session identifier for continuation
        - tool_calls: List of tool calls to execute (if paused at interrupt)
        - done: True if agent completed without needing tool execution
        - message: Agent's response message (if done)
    """
    agent = get_agent()

    # Create or reuse thread ID
    if thread_id is None:
        thread_id = generate_thread_id()

    config = {"configurable": {"thread_id": thread_id}}

    # Load existing conversation history from checkpoint
    existing_state = await agent.aget_state(config)
    existing_messages = existing_state.values.get("messages", []) if existing_state.values else []

    # VERY VISIBLE LOGGING
    print(f"\n{'='*60}")
    print(f"[HYBRID_AGENT] thread_id: {thread_id}")
    print(f"[HYBRID_AGENT] existing_messages count: {len(existing_messages)}")
    print(f"[HYBRID_AGENT] existing_state.values keys: {existing_state.values.keys() if existing_state.values else 'None'}")
    print(f"{'='*60}\n")

    # Build the full message with context if provided
    full_prompt = prompt
    if context:
        full_prompt = f"{context}\n\n---\n\nUser request: {prompt}"

    # Build the message list - include history if continuing conversation
    new_message = {"role": "user", "content": full_prompt}
    if existing_messages:
        messages_to_send = {"messages": existing_messages + [new_message]}
        print(f"[HYBRID_AGENT] CONTINUING conversation with {len(existing_messages)} + 1 messages")
    else:
        messages_to_send = {"messages": [new_message]}
        print(f"[HYBRID_AGENT] STARTING new conversation")

    # Invoke the agent
    result = await agent.ainvoke(
        messages_to_send,
        config=config,
    )

    # Check if we're paused at interrupt (tool calls pending)
    state = await agent.aget_state(config)

    if state.next:  # There are pending nodes (we hit interrupt)
        # Extract tool calls from the last AI message
        last_message = result["messages"][-1]
        tool_calls = []

        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            for tc in last_message.tool_calls:
                tool_calls.append({
                    "id": tc["id"],
                    "name": tc["name"],
                    "args": tc["args"],
                })

        return {
            "thread_id": thread_id,
            "tool_calls": tool_calls,
            "done": False,
            "message": None,
        }
    else:
        # Agent completed
        last_message = result["messages"][-1]
        content = last_message.content if hasattr(last_message, "content") else str(last_message)

        return {
            "thread_id": thread_id,
            "tool_calls": [],
            "done": True,
            "message": content,
        }


async def resume_agent_step(thread_id: str, tool_results: list[dict]) -> dict:
    """Resume agent after frontend tool execution.

    Args:
        thread_id: Session identifier from start_agent_step
        tool_results: List of tool results, each with:
            - id: Tool call ID from the original tool_calls
            - result: JSON string result from frontend execution

    Returns:
        Same format as start_agent_step
    """
    agent = get_agent()
    config = {"configurable": {"thread_id": thread_id}}

    # Build tool messages to resume with
    from langchain_core.messages import ToolMessage

    tool_messages = []
    for tr in tool_results:
        tool_messages.append(
            ToolMessage(
                content=tr["result"],
                tool_call_id=tr["id"],
            )
        )

    # Resume the agent with tool results
    result = await agent.ainvoke(
        Command(resume=tool_messages),
        config=config,
    )

    # Check state again
    state = await agent.aget_state(config)

    if state.next:  # More tool calls
        last_message = result["messages"][-1]
        tool_calls = []

        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            for tc in last_message.tool_calls:
                tool_calls.append({
                    "id": tc["id"],
                    "name": tc["name"],
                    "args": tc["args"],
                })

        return {
            "thread_id": thread_id,
            "tool_calls": tool_calls,
            "done": False,
            "message": None,
        }
    else:
        last_message = result["messages"][-1]
        content = last_message.content if hasattr(last_message, "content") else str(last_message)

        return {
            "thread_id": thread_id,
            "tool_calls": [],
            "done": True,
            "message": content,
        }


async def stream_agent_step(prompt: str, thread_id: Optional[str] = None, context: Optional[str] = None):
    """Stream agent events as SSE.

    Yields events:
        - thinking: Agent reasoning/processing
        - tool_calls: Tools to execute on frontend
        - message: Final response from agent
        - error: Any errors that occurred

    Args:
        prompt: The user's request
        thread_id: Optional existing thread ID to continue
        context: Optional song state context

    Yields:
        dict with 'type' and event-specific data
    """
    agent = get_agent()

    # Create or reuse thread ID
    is_new_thread = thread_id is None
    if thread_id is None:
        thread_id = generate_thread_id()

    config = {"configurable": {"thread_id": thread_id}}

    # Load existing conversation history from checkpoint
    existing_state = await agent.aget_state(config)
    existing_messages = existing_state.values.get("messages", []) if existing_state.values else []
    print(f"[DEBUG] Thread {thread_id[:8]}... is_new={is_new_thread}, existing_messages={len(existing_messages)}")

    # Build the full message with context if provided
    full_prompt = prompt
    if context:
        full_prompt = f"{context}\n\n---\n\nUser request: {prompt}"

    # Build the message list - include history if continuing conversation
    new_message = {"role": "user", "content": full_prompt}
    if existing_messages:
        # Continue existing conversation - append new message to history
        # The existing_messages are LangChain message objects, we need to pass them through
        messages_to_send = {"messages": existing_messages + [new_message]}
        print(f"[DEBUG] Continuing conversation with {len(existing_messages)} existing + 1 new message")
    else:
        # New conversation
        messages_to_send = {"messages": [new_message]}
        print(f"[DEBUG] Starting new conversation")

    try:
        # Emit thinking event
        yield {"type": "thinking", "thread_id": thread_id, "content": "Processing your request..."}

        # Track which LLM run we've seen to avoid duplicate tokens
        seen_tokens = set()

        # Stream events from the agent
        async for event in agent.astream_events(
            messages_to_send,
            config=config,
            version="v2",
        ):
            event_type = event.get("event")
            run_id = event.get("run_id", "")

            # Handle LLM streaming tokens - only from chat model events
            if event_type == "on_chat_model_stream":
                chunk = event.get("data", {}).get("chunk")
                if chunk and hasattr(chunk, "content") and chunk.content:
                    # Create a unique key for this token to avoid duplicates
                    token_key = f"{run_id}:{chunk.content}"
                    if token_key not in seen_tokens:
                        seen_tokens.add(token_key)
                        yield {"type": "thinking", "thread_id": thread_id, "content": chunk.content}

        # After streaming completes, check state for tool calls or completion
        state = await agent.aget_state(config)
        final_messages = state.values.get("messages", []) if state.values else []
        print(f"[DEBUG stream_agent_step] After stream: thread {thread_id[:8]}... has {len(final_messages)} messages")
        for i, msg in enumerate(final_messages):
            role = getattr(msg, 'type', 'unknown')
            content_preview = str(getattr(msg, 'content', ''))[:80]
            print(f"[DEBUG stream_agent_step]   [{i}] {role}: {content_preview}...")

        if state.next:
            # Agent is paused at interrupt - extract tool calls
            messages = state.values.get("messages", [])
            if messages:
                last_msg = messages[-1]
                if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
                    tool_calls = []
                    for tc in last_msg.tool_calls:
                        tool_calls.append({
                            "id": tc["id"],
                            "name": tc["name"],
                            "args": tc["args"],
                        })
                    yield {
                        "type": "tool_calls",
                        "thread_id": thread_id,
                        "tool_calls": tool_calls,
                        "done": False,
                    }
                    return

        # Agent completed - get final message
        messages = state.values.get("messages", [])
        if messages:
            last_message = messages[-1]
            content = last_message.content if hasattr(last_message, "content") else str(last_message)
            yield {
                "type": "message",
                "thread_id": thread_id,
                "content": content,
                "done": True,
            }

    except Exception as e:
        yield {"type": "error", "thread_id": thread_id, "error": str(e)}


async def stream_agent_resume(thread_id: str, tool_results: list[dict]):
    """Stream agent events after tool results are received.

    Yields events:
        - tool_results_received: Acknowledgment of tool results
        - thinking: Agent reasoning/processing
        - tool_calls: More tools to execute
        - message: Final response from agent
        - error: Any errors that occurred

    Args:
        thread_id: Session identifier from previous step
        tool_results: List of tool results from frontend

    Yields:
        dict with 'type' and event-specific data
    """
    from langchain_core.messages import ToolMessage

    agent = get_agent()
    config = {"configurable": {"thread_id": thread_id}}

    # Acknowledge tool results received
    yield {
        "type": "tool_results_received",
        "thread_id": thread_id,
        "count": len(tool_results),
    }

    # Build tool messages
    tool_messages = []
    for tr in tool_results:
        tool_messages.append(
            ToolMessage(
                content=tr["result"],
                tool_call_id=tr["id"],
            )
        )

    try:
        yield {"type": "thinking", "thread_id": thread_id, "content": "Processing tool results..."}

        # Track which LLM run we've seen to avoid duplicate tokens
        seen_tokens = set()

        # Stream events from the agent
        async for event in agent.astream_events(
            Command(resume=tool_messages),
            config=config,
            version="v2",
        ):
            event_type = event.get("event")
            run_id = event.get("run_id", "")

            # Handle LLM streaming tokens - only from chat model events
            if event_type == "on_chat_model_stream":
                chunk = event.get("data", {}).get("chunk")
                if chunk and hasattr(chunk, "content") and chunk.content:
                    # Create a unique key for this token to avoid duplicates
                    token_key = f"{run_id}:{chunk.content}"
                    if token_key not in seen_tokens:
                        seen_tokens.add(token_key)
                        yield {"type": "thinking", "thread_id": thread_id, "content": chunk.content}

        # After streaming completes, check state for tool calls or completion
        state = await agent.aget_state(config)

        if state.next:
            # Agent is paused at interrupt - extract tool calls
            messages = state.values.get("messages", [])
            if messages:
                last_msg = messages[-1]
                if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
                    tool_calls = []
                    for tc in last_msg.tool_calls:
                        tool_calls.append({
                            "id": tc["id"],
                            "name": tc["name"],
                            "args": tc["args"],
                        })
                    yield {
                        "type": "tool_calls",
                        "thread_id": thread_id,
                        "tool_calls": tool_calls,
                        "done": False,
                    }
                    return

        # Agent completed - get final message
        messages = state.values.get("messages", [])
        if messages:
            last_message = messages[-1]
            content = last_message.content if hasattr(last_message, "content") else str(last_message)
            yield {
                "type": "message",
                "thread_id": thread_id,
                "content": content,
                "done": True,
            }

    except Exception as e:
        yield {"type": "error", "thread_id": thread_id, "error": str(e)}
