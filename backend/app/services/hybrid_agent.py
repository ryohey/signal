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
HYBRID_SYSTEM_PROMPT = """You are a music composition assistant that creates MIDI compositions by calling tools.

You have access to tools that manipulate a MIDI sequencer:
- createTrack: Create a new track with an instrument
- addNotes: Add notes to an existing track
- setTempo: Set the tempo in BPM
- setTimeSignature: Set the time signature

IMPORTANT: When calling tools, you must use the exact parameter names and formats specified.

SONG STATE CONTEXT:
You will receive the current song state before each request. This tells you:
- Current tempo and time signature
- Existing tracks with their IDs, instruments, channels, and note counts
- Track [0] is usually the conductor track (tempo/time signature only)

Use this context to:
- Reference existing tracks by their ID when adding notes
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
```

MIDI REFERENCE:
- Note numbers: Middle C = 60, each semitone = +1 (C4=60, D4=62, E4=64, F4=65, G4=67, A4=69, B4=71)
- Timing: 480 ticks = 1 quarter note
- Durations: whole=1920, half=960, quarter=480, eighth=240, sixteenth=120
- Velocity: 1-127 (loudness), typical range 60-100
- Common scales from C: Major [60,62,64,65,67,69,71,72], Minor [60,62,63,65,67,68,70,72]

WORKFLOW:
1. Check the song state to see what exists
2. For simple requests, call tools directly
3. For complex compositions, plan first then execute step by step
4. Only set tempo/time signature if needed (check current values first)
5. Reuse existing tracks when appropriate instead of creating new ones

Be concise in your responses. Focus on executing the user's request efficiently."""


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


# All available tools
TOOLS = [createTrack, addNotes, setTempo, setTimeSignature]


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

    # Build the full message with context if provided
    full_prompt = prompt
    if context:
        full_prompt = f"{context}\n\n---\n\nUser request: {prompt}"

    # Invoke the agent
    result = await agent.ainvoke(
        {"messages": [{"role": "user", "content": full_prompt}]},
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
    if thread_id is None:
        thread_id = generate_thread_id()

    config = {"configurable": {"thread_id": thread_id}}

    # Build the full message with context if provided
    full_prompt = prompt
    if context:
        full_prompt = f"{context}\n\n---\n\nUser request: {prompt}"

    try:
        # Emit thinking event
        yield {"type": "thinking", "thread_id": thread_id, "content": "Processing your request..."}

        # Track which LLM run we've seen to avoid duplicate tokens
        seen_tokens = set()

        # Stream events from the agent
        async for event in agent.astream_events(
            {"messages": [{"role": "user", "content": full_prompt}]},
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
