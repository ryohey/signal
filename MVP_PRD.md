# Product Requirements Document (PRD)
# AI-Assisted Music Composition Tool

**Project Name:** AI Music Composer  
**Team Size:** 4 developers  
**Timeline:** 2-3 weeks (MVP)  
**Last Updated:** December 10, 2024

---

## 1. Executive Summary

### Vision
Create an AI-powered music composition tool that enables musicians to rapidly iterate on song ideas through natural language commands, while maintaining creative control through manual MIDI editing. The tool combines the speed of AI generation with the precision of traditional MIDI editing.

### Core Philosophy
**"Do-it-WITH-me"** not **"Do-it-FOR-me"**

We're accelerating the creative process, not replacing it. Artists direct the composition through conversation, and the AI suggests and generates tracks that can be manually refined.

### Key Differentiators
- **Collaborative creativity:** AI suggests, user directs and refines
- **Rapid iteration:** Regenerate individual tracks with text commands
- **Full manual control:** Professional piano roll editing after AI generation
- **Cohesive multi-track generation:** All instruments generated together for musical coherence

---

## 2. Product Goals

### Primary Goals
1. **Speed to first draft:** Generate a complete multi-track indie rock song in <60 seconds
2. **Easy iteration:** Modify individual tracks with simple text commands (e.g., "make the bass simpler")
3. **Professional output:** Export production-ready MIDI files for use in any DAW
4. **Low barrier to entry:** No installation required, works in browser

### Success Metrics
- **Time to first playback:** <60 seconds from prompt to hearing a full song
- **Iteration speed:** <10 seconds to regenerate a single track
- **User satisfaction:** Users can export and use MIDI files in their DAW
- **Manual editing usage:** 80%+ of users manually edit at least one track after AI generation

---

## 3. Target Users

### Primary User: Indie Rock Musicians
- **Profile:** Songwriters, bedroom producers, indie rock bands
- **Technical level:** Basic understanding of music theory (knows chords, tempo, song structure)
- **Current workflow:** Uses DAWs like Ableton, Logic, or GarageBand
- **Pain points:**
  - Starting from scratch takes too long
  - Writer's block on instrumental parts
  - Want to hear ideas quickly before committing time
  - Need realistic-sounding demos to share with band

### Use Cases
1. **Rapid prototyping:** "I have a melody idea, need a full arrangement quickly"
2. **Writer's block:** "I have verse and chorus, need help with the bridge"
3. **Learning:** "Show me what a typical indie rock bass line sounds like"
4. **Collaboration prep:** "Generate a demo to share with my band before rehearsal"

---

## 4. User Stories

### Core User Journeys

**Story 1: First-Time Generation**
```
As a songwriter,
I want to describe my song idea in natural language,
So that I can quickly hear a full multi-track arrangement.

Acceptance Criteria:
- User types: "Upbeat indie rock song in Am, 120 BPM"
- AI generates 4-5 tracks (drums, bass, guitar, keys, vocal melody)
- All tracks play together cohesively
- User can play/pause and adjust volume per track
```

**Story 2: Iterating on a Track**
```
As a musician,
I want to refine individual instruments without starting over,
So that I can quickly explore variations.

Acceptance Criteria:
- User says: "Make the bass focus more on root notes"
- Only the bass track regenerates
- Other tracks remain unchanged
- Changes integrate smoothly with existing tracks
```

**Story 3: Manual Refinement**
```
As a producer,
I want to manually edit MIDI notes after AI generation,
So that I have full creative control over the final result.

Acceptance Criteria:
- User can click on any track to open piano roll
- User can add, delete, move, and adjust velocity of notes
- Changes are heard immediately on playback
- Undo/redo works for manual edits
```

**Story 4: Export**
```
As a musician,
I want to export my tracks to use in my DAW,
So that I can finish production with professional tools.

Acceptance Criteria:
- User can export individual MIDI files (one per track)
- User can export full mix as WAV
- Files import correctly into Ableton/Logic/other DAWs
- All notes, timing, and velocity preserved
```

---

## 5. Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────┐
│         SIGNAL FORK (Frontend)                   │
│  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ AI Chat      │  │   Multi-Track Editor     │ │
│  │ Panel        │  │   - Piano Roll (Signal)  │ │
│  │ (NEW)        │  │   - Track Controls       │ │
│  │              │  │   - Timeline             │ │
│  └──────────────┘  │   - Section Markers(NEW) │ │
│                     └─────────────────────────┘ │
│                     ┌─────────────────────────┐ │
│                     │   Playback Engine        │ │
│                     │   (Signal's Web Audio)   │ │
│                     └─────────────────────────┘ │
└─────────────────────────────────────────────────┘
                          ↕ REST API
┌─────────────────────────────────────────────────┐
│         FastAPI BACKEND (Python)                 │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  LLM Orchestration Layer                  │  │
│  │  - Anthropic Claude API integration       │  │
│  │  - Prompt engineering for code generation │  │
│  │  - Parse user iteration requests          │  │
│  └──────────────────────────────────────────┘  │
│                     ↓                            │
│  ┌──────────────────────────────────────────┐  │
│  │  Code Generation & Execution              │  │
│  │  - Generate Python/MIDIUtil code          │  │
│  │  - Sandboxed execution                    │  │
│  │  - Multi-track cohesion logic             │  │
│  └──────────────────────────────────────────┘  │
│                     ↓                            │
│  ┌──────────────────────────────────────────┐  │
│  │  MIDI Generation (MIDIUtil)               │  │
│  │  - Create MIDI files per track            │  │
│  │  - Apply humanization                     │  │
│  │  - Enforce song structure                 │  │
│  └──────────────────────────────────────────┘  │
│                     ↓                            │
│  ┌──────────────────────────────────────────┐  │
│  │  Export & Rendering                       │  │
│  │  - MIDI file serving                      │  │
│  │  - WAV export (FluidSynth)                │  │
│  │  - Mixing (volume/pan)                    │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Tech Stack

**Frontend (Signal Fork):**
- React + TypeScript
- Signal's existing MIDI editor
- Web Audio API (Signal's implementation)
- Tailwind CSS for new components
- Deployed on Vercel

**Backend:**
- FastAPI (Python)
- Anthropic Claude API (code generation)
- MIDIUtil (MIDI file creation)
- FluidSynth (WAV rendering)
- Deployed on Railway

**Data Storage (MVP):**
- Session-based (no persistence)
- Files stored temporarily on Railway
- No authentication/database

---

## 6. MVP Feature Scope

### Must-Have Features (MVP)

#### 6.1 AI Generation Interface

**Initial Generation**
- Text input box for song description
- Support for specifying:
  - Genre: Indie rock (MVP focus)
  - Key: Any major/minor key
  - Tempo: Any BPM
  - Mood/style: Free text (e.g., "upbeat", "moody")
  - Reference artist: Optional (e.g., "like early Arcade Fire")
- **LLM suggests:**
  - Instrumentation (4-5 tracks)
  - Song structure (Intro, Verse, Chorus, Bridge, Outro)
  - Chord progressions per section
  - Arrangement density per section
- **User can override** song structure in initial prompt
- Loading state while generating
- Error handling with user-friendly messages

**Iteration Commands**
- Text input for modifications
- Examples:
  - "Make the bass simpler"
  - "The guitar is too busy"
  - "Add more energy to the chorus"
  - "Change chorus chords to F-C-G-Am"
- Only regenerates affected track(s)
- Other tracks remain unchanged
- New MIDI integrates seamlessly

#### 6.2 Multi-Track Editor (Signal Base)

**Track Controls**
- Volume slider per track (0-100)
- Pan control per track (L-R)
- Mute button per track
- Solo button per track
- Track name display
- "Regenerate with AI" button per track

**Piano Roll Editor** (Signal's existing implementation)
- Full note editing (add, delete, move, resize)
- Velocity editing per note
- Multi-select notes
- Copy/paste notes
- Quantization
- Zoom/scroll
- Undo/redo (Signal's existing)

**Transport Controls** (Signal's existing)
- Play/pause
- Stop
- Timeline scrubber
- Time display (bars:beats)
- Loop region (optional for MVP)

#### 6.3 Song Structure Management

**Section Markers** (NEW - Must Build)
- Visual markers in timeline showing:
  - Verse
  - Chorus
  - Bridge
  - Intro
  - Outro
  - Pre-Chorus (optional)
- Color-coded sections
- Display section name and bar range
- Automatically generated from AI
- User can manually adjust section boundaries (nice-to-have)

**Data Model:**
```typescript
interface Section {
  id: string;
  name: "intro" | "verse" | "chorus" | "bridge" | "outro" | "pre-chorus";
  startBar: number;
  endBar: number;
  chords: string[]; // e.g., ["Am", "F", "C", "G"]
}
```

#### 6.4 Playback & Audio

**Audio Engine** (Signal's existing)
- Uses Signal's Web Audio implementation
- Basic soundfonts for preview
- No effects (reverb, delay, etc.)
- Latency optimization for real-time editing

**Soundfonts:**
- Use Signal's default sounds for MVP
- Support for loading .sf2 files (Signal has this)

#### 6.5 Export

**MIDI Export**
- Download individual track MIDI files
- Each track as separate .mid file
- Standard MIDI 1.0 format
- Preserves all note data, velocity, timing
- Includes tempo/time signature metadata

**WAV Export**
- Full mix rendered to WAV
- 44.1kHz, 16-bit (standard)
- Applies current volume/pan settings
- Uses FluidSynth on backend
- GeneralUser GS soundfont (free, decent quality)

#### 6.6 Cohesion System

**Multi-Track Generation Strategy**
LLM generates **one unified Python script** that creates all tracks together:

```python
def generate_indie_rock_song():
    # Shared parameters
    tempo = 120
    key = "Am"
    structure = {
        "intro": 8,
        "verse": 16,
        "chorus": 16,
        # ...
    }
    
    # Shared chord progressions per section
    chords = {
        "intro": ["Am", "F", "C", "G"],
        "verse": ["Am", "F", "C", "G"],
        "chorus": ["F", "C", "G", "Am"],
    }
    
    # Generate all tracks with shared context
    drums = generate_drums(structure, tempo, energy="medium")
    bass = generate_bass(structure, chords, tempo, follows_kick=True)
    guitar = generate_guitar(structure, chords, tempo, leaves_space_for=bass)
    keys = generate_keys(structure, chords, tempo, density="sparse")
    
    return {
        "drums": drums,
        "bass": bass,
        "guitar": guitar,
        "keys": keys
    }
```

**Cohesion Rules** (enforced in LLM system prompt):
1. All tracks share tempo, time signature, song structure
2. Bass follows kick drum rhythmically (locks on beats 1 and 3)
3. Harmonic instruments (guitar, keys) play chord tones
4. Density varies by section (sparse verse, full chorus)
5. Frequency separation (bass low, guitar mid, keys high)

#### 6.7 Humanization

**Timing Humanization:**
- ±15ms random variation on note timing
- Kick and snare downbeats stay on-grid
- Amount varies by genre (indie rock: medium)

**Velocity Humanization:**
- Random variation ±10-15 velocity units
- Hi-hat variations create groove
- Acoustic instruments (guitar) more variation than keys

**Implementation:**
```python
def humanize_notes(notes, timing_variance=0.015, velocity_variance=10):
    humanized = []
    for time, note, velocity in notes:
        # Randomize timing (±15ms)
        new_time = time + random.uniform(-timing_variance, timing_variance)
        # Randomize velocity (±10)
        new_velocity = max(1, min(127, velocity + random.randint(-velocity_variance, velocity_variance)))
        humanized.append((new_time, note, new_velocity))
    return humanized
```

---

### 6.8 MVP Constraints & Limitations

**What's NOT in MVP:**
- ❌ No user accounts or authentication
- ❌ No project saving/loading (session-based only)
- ❌ No collaboration features
- ❌ No effects (reverb, delay, EQ)
- ❌ No automation lanes
- ❌ No tempo/key changes after initial generation
- ❌ Only one genre: Indie rock
- ❌ No generation history/undo for AI changes
- ❌ No visual pinning of measures (text commands only)
- ❌ No progress bars during generation (just spinner)
- ❌ No vocal synthesis (vocal melody is MIDI only)

---

## 7. Technical Implementation Details

### 7.1 LLM System Prompt (Key Excerpt)

```
You are a music composition assistant specializing in indie rock.

When a user requests a song, generate Python code using MIDIUtil that creates 
a cohesive multi-track arrangement.

CRITICAL RULES:
1. Generate ONE Python function that creates ALL tracks
2. All tracks must share:
   - Tempo
   - Time signature  
   - Song structure (section names and bar counts)
   - Chord progressions per section

3. For indie rock, typical instrumentation:
   - Drums: kick, snare, hi-hat, crash (4/4 beat)
   - Bass: root notes, eighth note grooves
   - Guitar: strummed chords, arpeggios
   - Keys: pads, textures (optional)
   - Vocal melody: single note line (MIDI, no lyrics)

4. Rhythmic cohesion:
   - Bass must lock with kick drum
   - All instruments respect the drum pattern
   
5. Harmonic cohesion:
   - Bass plays chord roots or fifths
   - Guitar/keys play full chords
   - Melody stays in key

6. Dynamic cohesion by section:
   - Intro: Sparse (1-2 instruments)
   - Verse: Medium (3 instruments)
   - Chorus: Full (all instruments)
   - Bridge: Varied
   - Outro: Fade (reduce instruments)

EXAMPLE STRUCTURE:
def generate_indie_rock_song():
    # [implementation]
    return {"drums": midi_track, "bass": midi_track, ...}
```

### 7.2 Code Execution Sandbox

**Security Requirements:**
- Isolated subprocess execution
- 30-second timeout
- Limited imports (only midiutil, random, math)
- No file system access except output
- No network access

**Implementation:**
```python
def execute_midi_generation(code: str) -> Dict[str, bytes]:
    with tempfile.TemporaryDirectory() as tmpdir:
        code_file = Path(tmpdir) / "generate.py"
        code_file.write_text(code)
        
        result = subprocess.run(
            ["python", str(code_file)],
            capture_output=True,
            timeout=30,
            cwd=tmpdir,
            env={"PYTHONPATH": "/app"}
        )
        
        if result.returncode != 0:
            raise GenerationError(result.stderr)
        
        # Collect generated MIDI files
        midi_files = {}
        for midi_path in Path(tmpdir).glob("*.mid"):
            midi_files[midi_path.stem] = midi_path.read_bytes()
        
        return midi_files
```

### 7.3 Backend API Endpoints

**POST /api/generate**
- Input: `{ prompt: string }`
- Output: `{ tracks: { name: string, midiData: base64 }[], metadata: {...} }`
- Generates initial multi-track song

**POST /api/regenerate**
- Input: `{ trackName: string, instruction: string, currentContext: {...} }`
- Output: `{ trackName: string, midiData: base64 }`
- Regenerates single track

**POST /api/export/wav**
- Input: `{ tracks: [...], volumes: {...}, pans: {...} }`
- Output: WAV file (audio/wav)
- Renders final mix using FluidSynth

**GET /api/health**
- Health check for backend

### 7.4 Signal Integration Points

**New Components to Add:**

```typescript
// src/components/AIChat.tsx
export function AIChat({ onGenerate, onRegenerate }) {
  // Chat UI for AI interaction
}

// src/components/SectionMarkers.tsx
export function SectionMarkers({ sections, songLength }) {
  // Visual section display in timeline
}

// src/services/aiBackend.ts
export async function generateTracks(prompt: string) {
  // API calls to backend
}

export async function regenerateTrack(trackName: string, instruction: string) {
  // API calls to backend
}
```

**Modified Signal Components:**

```typescript
// Modify: src/components/TrackList.tsx
// Add: "Regenerate with AI" button per track

// Modify: src/stores/song.ts (or equivalent state)
// Add: section markers data structure

// Modify: src/components/Timeline.tsx
// Add: section marker rendering
```

---

## 8. User Interface Mockup (Text Description)

### Main Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]                                    [Export ▼]        │
├─────────────────────┬───────────────────────────────────────┤
│                     │                                        │
│  AI CHAT PANEL      │         MULTI-TRACK EDITOR            │
│  ┌───────────────┐  │  ┌──────────────────────────────────┐│
│  │ Generate new  │  │  │ [Intro][Verse][Chorus][Verse]... ││ <- Section markers
│  │ song from     │  │  └──────────────────────────────────┘│
│  │ prompt...     │  │                                        │
│  └───────────────┘  │  ┌─Track: Drums──────────────────────┐│
│                     │  │ [M][S] ▋▋▋▋▋▋▋  ◀───▶  [Regen AI] ││
│  [User]: Upbeat    │  │ [Piano Roll View] ................. ││
│  indie rock in Am   │  └────────────────────────────────────┘│
│                     │                                        │
│  [AI]: I'll create │  │  ┌─Track: Bass────────────────────┐ │
│  drums, bass,      │  │  │ [M][S] ▋▋▋▋  ◀───▶  [Regen AI]│ │
│  guitar, keys...   │  │  │ [Piano Roll View] ............. │ │
│                     │  │  └────────────────────────────────┘ │
│  [User]: Make the  │  │                                        │
│  bass simpler      │  │  ┌─Track: Guitar──────────────────┐ │
│                     │  │  │ [M][S] ▋▋▋▋  ◀───▶  [Regen AI]│ │
│  ┌───────────────┐  │  │  └────────────────────────────────┘ │
│  │ Type message  │  │  │                                        │
│  │ ...           │  │  │  [◀◀] [▶️] [⏹] [⏸] [Timeline ...]    │
│  └───────────────┘  │  │                                        │
│                     │                                        │
└─────────────────────┴───────────────────────────────────────┘

Legend:
[M] = Mute
[S] = Solo
▋▋▋ = Volume slider
◀───▶ = Pan control
```

---

## 9. Development Timeline & Milestones

### Week 1: Foundation

**Days 1-2: Setup & Proof of Concept**
- [ ] Fork Signal repository
- [ ] Run Signal locally, confirm functionality
- [ ] Setup FastAPI backend skeleton
- [ ] Integrate Anthropic Claude API
- [ ] Basic MIDIUtil code generation (single track)
- **Milestone:** Generate one drum track from text prompt

**Days 3-4: Multi-Track Generation**
- [ ] Implement cohesive multi-track generation
- [ ] All 4-5 instruments generate together
- [ ] Add humanization logic
- [ ] Test chord progression enforcement
- **Milestone:** Generate complete 4-track indie rock song

**Days 5-7: Signal Integration**
- [ ] Add API integration layer to Signal
- [ ] Load generated MIDI into Signal's tracks
- [ ] Verify playback works
- [ ] Test manual editing after AI generation
- **Milestone:** End-to-end generation → playback → edit flow

### Week 2: Core Features

**Days 8-10: Iteration System**
- [ ] Build chat interface component
- [ ] Implement iteration parsing backend
- [ ] Per-track regeneration logic
- [ ] Maintain context across iterations
- **Milestone:** User can iterate on individual tracks

**Days 11-12: Section Markers**
- [ ] Design section marker data structure
- [ ] Build section marker UI component
- [ ] Integrate with timeline display
- [ ] Export section metadata with MIDI
- **Milestone:** Song structure visible and editable

**Days 13-14: Export & Polish**
- [ ] MIDI export for individual tracks
- [ ] WAV export with FluidSynth
- [ ] Volume/pan mixing on export
- [ ] Loading states and error handling
- **Milestone:** Complete export functionality

### Week 3: Testing & Refinement

**Days 15-17: Bug Fixes & UX**
- [ ] Comprehensive testing of all workflows
- [ ] Fix critical bugs
- [ ] UI/UX improvements
- [ ] Performance optimization
- **Milestone:** Stable, usable MVP

**Days 18-19: Documentation & Deploy**
- [ ] User documentation/tutorial
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Railway
- [ ] Setup monitoring/logging
- **Milestone:** Deployed and accessible

**Day 20-21: Buffer**
- [ ] Final polish
- [ ] Demo preparation
- [ ] Presentation ready

---

## 10. Success Metrics

### Quantitative Metrics

**Performance:**
- Generation time: <60 seconds for full song
- Iteration time: <10 seconds per track
- Export time: <5 seconds for MIDI, <30 seconds for WAV
- Uptime: >95%

**Usage:**
- 80%+ users manually edit at least one track
- 60%+ users export at least one file
- Average 3+ iterations per session
- 70%+ users complete full workflow (generate → iterate → export)

### Qualitative Metrics

**User Feedback:**
- "The AI suggestions are musically coherent"
- "I can quickly prototype song ideas"
- "Manual editing after AI is smooth"
- "Export quality is good enough for DAW work"

**Technical Quality:**
- MIDI files import correctly into major DAWs
- Tracks stay in sync/time
- No audio glitches or crashes
- Cohesiveness score: 8/10+ (user rated)

---

## 11. Risks & Mitigation

### Technical Risks

**Risk 1: AI-generated tracks lack musical cohesion**
- **Mitigation:** Unified generation script, strict cohesion rules in prompt
- **Backup plan:** Manually tune generation templates for indie rock

**Risk 2: Code execution security vulnerabilities**
- **Mitigation:** Sandboxed subprocess, timeout limits, restricted imports
- **Backup plan:** Pre-generate template code, LLM only modifies parameters

**Risk 3: Signal integration complexity**
- **Mitigation:** Start with minimal changes, use Signal's existing APIs
- **Backup plan:** Build simpler custom UI if Signal is too rigid

**Risk 4: WAV export quality insufficient**
- **Mitigation:** Test FluidSynth with good soundfonts early
- **Backup plan:** MIDI-only export for MVP, WAV in V2

### Product Risks

**Risk 1: LLM generates invalid/broken code**
- **Mitigation:** Strict output format, extensive testing, fallback templates
- **Monitoring:** Log all generated code, track failure rate

**Risk 2: Users don't understand how to iterate**
- **Mitigation:** Add example commands, tooltip hints, onboarding flow
- **Monitoring:** Track which commands users try

**Risk 3: Generation is too slow (>60 seconds)**
- **Mitigation:** Optimize LLM prompts, cache common patterns
- **Monitoring:** Track p50, p95, p99 generation times

---

## 12. Future Enhancements (V2+)

### Phase 2 Features

**Persistence & Accounts**
- User accounts (auth)
- Save/load projects
- Cloud storage for MIDI files
- Project sharing

**Enhanced Iteration**
- Generation history with undo
- Visual measure pinning (protect sections from AI)
- A/B comparison of iterations
- Progress indicators during generation

**Additional Genres**
- Electronic/Dance
- Jazz
- Lo-fi Hip Hop
- Acoustic/Folk

**Audio Improvements**
- Better soundfonts
- Basic effects (reverb, EQ)
- Mixing automation
- User-uploaded soundfonts/VSTs

### Phase 3 Features

**Advanced AI**
- Multi-model support (GPT-4, other)
- Style transfer from reference audio
- Lyrics generation
- Vocal synthesis integration

**Collaboration**
- Real-time multi-user editing
- Comments/annotations
- Version control for projects

**Mobile Support**
- Responsive design for tablets
- Touch-optimized piano roll

**MIDI 2.0**
- When Web MIDI API supports it
- Higher resolution exports

---

## 13. Open Questions & Assumptions

### Questions to Validate During Development

1. **Is 60 seconds fast enough for generation?** Users may expect <30 seconds
2. **Do users understand section-based iteration?** ("regenerate the chorus") vs track-based ("regenerate guitar")
3. **Is MIDI 1.0 sufficient for professional use?** Most DAWs support it, but test with real users
4. **Should we support non-4/4 time signatures in MVP?** Or defer to V2?

### Assumptions

1. Users have basic music theory knowledge (chords, tempo, structure)
2. Users will primarily export MIDI, not WAV (MVP focus)
3. 4-5 tracks is sufficient for indie rock demos
4. Session-based (no persistence) is acceptable for MVP
5. Desktop browser usage (mobile not priority)

---

## 14. Appendices

### A. Example Prompts

**Good prompts:**
- "Upbeat indie rock in G major, 128 BPM, like Arctic Monkeys"
- "Moody post-punk song in Dm, 95 BPM, sparse arrangement"
- "Energetic garage rock with driving bass, 140 BPM"

**Iteration examples:**
- "Make the bass simpler, just root notes"
- "Add more energy to the chorus"
- "Guitar is too loud, turn it down"
- "Change verse chords to Am-F-C-G"

### B. Technology References

**Key Libraries:**
- Signal (MIT): https://github.com/ryohey/signal
- MIDIUtil: https://github.com/MarkCWirt/MIDIUtil
- Tone.js: https://tonejs.github.io/
- FluidSynth: https://www.fluidsynth.org/

**Soundfonts:**
- GeneralUser GS: http://schristiancollins.com/generaluser.php
- FluidR3_GM: https://github.com/FluidSynth/fluidsynth/wiki/SoundFont

---

## 15. Glossary

- **DAW:** Digital Audio Workstation (Ableton, Logic, GarageBand, etc.)
- **MIDI:** Musical Instrument Digital Interface - digital music data format
- **Piano Roll:** Visual editor showing notes as blocks on a timeline
- **Soundfont:** Collection of instrument samples (.sf2 file)
- **Quantization:** Snapping notes to grid for timing correction
- **Velocity:** How hard a note is played (affects volume/timbre)
- **Cohesion:** How well multiple tracks work together musically
- **Humanization:** Adding subtle timing/velocity variations to sound realistic