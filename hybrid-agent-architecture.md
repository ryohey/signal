# Hybrid Agent Architecture

The hybrid agent enables AI-powered music composition by running LLM reasoning on the backend while executing tools directly on the frontend against the MobX store. This gives you the best of both worlds: secure API key management and real-time UI updates.

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                         HYBRID AGENT FLOW                        │
└─────────────────────────────────────────────────────────────────┘

   User: "Create a piano track and add a C major scale"
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (React/MobX)                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ agentLoop.ts                                             │   │
│  │  - Sends prompt to backend                               │   │
│  │  - Receives tool_calls                                   │   │
│  │  - Executes tools on MobX store                          │   │
│  │  - Sends results back, loops until done                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                     │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ toolExecutor.ts                                          │   │
│  │  - Maps tool calls to store operations                   │   │
│  │  - createTrack → song.addTrack()                         │   │
│  │  - addNotes → track.addEvents()                          │   │
│  │  - UI updates reactively via MobX                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP POST /api/agent/step
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND (FastAPI/LangGraph)                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ hybrid_agent.py                                          │   │
│  │  - LangGraph agent with interrupt_before=["tools"]       │   │
│  │  - LLM decides which tools to call                       │   │
│  │  - Pauses before execution, returns tool_calls           │   │
│  │  - Resumes with tool results from frontend               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                     │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ LLM (Claude via OpenRouter)                              │   │
│  │  - Reasons about user request                            │   │
│  │  - Generates tool calls with arguments                   │   │
│  │  - Iterates until task complete                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## The Request/Response Cycle

### 1. Start Request
```typescript
POST /api/agent/step
{ "prompt": "Create a piano track" }

Response:
{
  "thread_id": "abc-123",
  "tool_calls": [{ "id": "xyz", "name": "createTrack", "args": { "instrumentName": "piano" } }],
  "done": false
}
```

### 2. Frontend Executes Tools
```typescript
// toolExecutor.ts
const result = executeToolCalls(song, toolCalls)
// → song.addTrack() is called
// → UI updates reactively
// → Returns: [{ id: "xyz", result: '{"trackId": 1, ...}' }]
```

### 3. Resume Request
```typescript
POST /api/agent/step
{
  "thread_id": "abc-123",
  "tool_results": [{ "id": "xyz", "result": "{\"trackId\": 1, ...}" }]
}

Response:
{
  "thread_id": "abc-123",
  "tool_calls": [],  // or more tools if needed
  "done": true,
  "message": "Created piano track successfully"
}
```

## Available Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `createTrack` | Create a new MIDI track | `instrumentName`: GM name or alias ("piano", "drums", etc.)<br>`trackName`: Optional display name |
| `addNotes` | Add notes to a track | `trackId`: From createTrack result<br>`notes`: Array of `{pitch, start, duration, velocity?}` |
| `setTempo` | Set song tempo | `bpm`: 20-300<br>`tick`: Position (default 0) |
| `setTimeSignature` | Set time signature | `numerator`, `denominator`, `tick` |

### MIDI Reference
- **Pitch**: Middle C = 60, each semitone = +1
- **Timing**: 480 ticks = 1 quarter note
- **Durations**: whole=1920, half=960, quarter=480, eighth=240, sixteenth=120
- **Velocity**: 1-127 (loudness)

## Key Components

### Backend

**`backend/app/services/hybrid_agent.py`**
- Creates LangGraph agent with `create_react_agent()`
- Uses `interrupt_before=["tools"]` to pause before tool execution
- `MemorySaver` checkpointer maintains conversation state across requests
- `start_agent_step()` and `resume_agent_step()` handle the request cycle

**`backend/app/routers/generate.py`**
- `POST /api/agent/step` endpoint
- Handles both start (with `prompt`) and resume (with `tool_results`) modes

### Frontend

**`app/src/services/hybridAgent/agentLoop.ts`**
- Main loop that coordinates with backend
- Sends prompts, receives tool calls, executes them, sends results back
- Continues until `done: true`

**`app/src/services/hybridAgent/toolExecutor.ts`**
- Maps tool names to MobX store operations
- Executes against the live `Song` object
- Returns JSON results for the agent

**`app/src/components/AIChat/AIChat.tsx`**
- UI integration with "Hybrid Agent" dropdown option
- Shows tool executions in chat as they happen

## Why This Architecture?

| Concern | Solution |
|---------|----------|
| **API Key Security** | Keys stay on backend, never exposed to browser |
| **Real-time UI** | Tools execute on frontend, MobX triggers reactive updates |
| **Session State** | LangGraph checkpointer maintains conversation context |
| **Extensibility** | Add new tools by defining them in both backend and frontend |
| **Latency** | ~100ms network overhead per loop iteration (LLM call dominates) |

## Extending the Agent

### Adding a New Tool

1. **Backend** - Add tool definition in `hybrid_agent.py`:
```python
@tool
def deleteTrack(trackId: int) -> str:
    """Deletes a track from the song.

    Args:
        trackId: The track ID to delete
    """
    return '{"status": "pending_frontend_execution"}'

# Add to TOOLS list
TOOLS = [createTrack, addNotes, setTempo, setTimeSignature, deleteTrack]
```

2. **Frontend** - Add execution in `toolExecutor.ts`:
```typescript
case "deleteTrack": {
  const trackId = args.trackId as number
  const track = song.tracks[trackId]
  if (!track) {
    return JSON.stringify({ error: `Track ${trackId} not found` })
  }
  song.removeTrack(track)
  return JSON.stringify({ deleted: trackId })
}
```

### Adding State Observation

To let the agent "see" the current song state, modify `agentLoop.ts`:

```typescript
// Serialize current state to include in prompts
function serializeSongState(song: Song): string {
  return JSON.stringify({
    trackCount: song.tracks.length,
    tracks: song.tracks.map((t, i) => ({
      id: i,
      name: t.name,
      channel: t.channel,
      noteCount: t.events.filter(e => e.subtype === "note").length
    }))
  })
}

// Include in initial request
body: JSON.stringify({
  prompt: userMessage,
  context: serializeSongState(song)  // Agent can see current state
})
```

## Reference Materials

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangGraph Interrupts](https://langchain-ai.github.io/langgraph/how-tos/human_in_the_loop/breakpoints/)
- [DeepAgents Library](https://github.com/langchain-ai/deepagents)
- [MobX Reactivity](https://mobx.js.org/README.html)
- [General MIDI Specification](https://www.midi.org/specifications-old/item/gm-level-1-sound-set)

## Future Improvements

- **Streaming**: Stream agent thinking/progress to frontend
- **State Observation**: Let agent query current song state
- **More Tools**: Selection, deletion, quantization, transposition
- **Undo Integration**: Wrap tool executions in undo transactions
- **Multi-turn Memory**: Persist conversation history across sessions
