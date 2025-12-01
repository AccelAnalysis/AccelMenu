# NotaQuest - Minimum Viable Product Requirements

## 1. Core Game Loop
- **Single-screen gameplay** with immediate feedback
- **10-round session** with randomized notes
- **Note range**: A3 to G4 (treble clef)
- **Scoring system**:
  - +100 points for correct first try
  - +50 points for correct second try
  - Game ends after 10 rounds

## 2. Technical Requirements

### 2.1 Core Components

#### StaffDisplay
- Renders the musical staff (treble clef)
- Displays the current note in standard notation
- Handles note positioning on the staff

#### NoteRenderer
- Renders the current note on the staff
- Handles note animations (appear/disappear)
- Supports whole/half/quarter note types (MVP: quarter notes only)

#### AnswerButtons
- Displays A-G note buttons
- Handles user input
- Provides visual feedback for correct/incorrect answers

#### ScorePanel
- Displays current score
- Shows round progress (X/10)
- Accuracy percentage
- Timer (optional stretch goal)

#### GameController
- Manages game state
- Handles round progression
- Calculates scoring
- Manages session persistence

#### AudioPlayer (Optional Stretch)
- Plays note sounds on correct answers
- Provides audio feedback

### 2.2 Utility Functions
- `randomNote()`: Generates a random note (A-G)
- `noteToPosition()`: Converts note letter to staff position
- `checkAnswer()`: Validates player's answer
- `calculateScore()`: Handles scoring logic

## 3. Data Structure

### 3.1 Note Data (JSON)
```json
{
  "notes": [
    {
      "id": "A4",
      "name": "A",
      "octave": 4,
      "position": 5,
      "accidental": null
    }
    // ... other notes
  ]
}
```

## 4. UI/UX Requirements

### 4.1 Pages
1. **Home Page** (`/`)
   - Game title and description
   - Start Game button
   - Settings (optional)

2. **Game Page** (`/play`)
   - Staff with current note
   - Answer buttons (A-G)
   - Score panel
   - Pause/Quit options

3. **Results Page** (`/results`)
   - Final score
   - Accuracy percentage
   - Missed notes breakdown
   - Play Again button
   - Share results (optional)

### 4.2 Mobile Considerations
- Touch-friendly buttons
- Responsive layout
- Portrait and landscape support
- Visual feedback for touch interactions

## 5. Animation Requirements
- Note appearance/disappearance
- Correct/incorrect answer feedback
- Score updates
- Round transitions

## 6. Performance Targets
- 60 FPS animation
- <100ms input latency
- <2s initial load time
- <50MB total app size

## 7. Future Enhancements (Post-MVP)
1. Multiple clefs (bass, alto, tenor)
2. Different note durations
3. Key signatures
4. Leaderboards
5. Note audio playback
6. Practice modes
7. Note naming systems (Do-Re-Mi, etc.)

## 8. Success Metrics
- Average session duration: 3-5 minutes
- Target accuracy: 80%+
- Return rate: 30%+
- Error rate: <5% (UI/UX issues)

## 9. Testing Requirements
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile device testing (iOS, Android)
- Screen reader accessibility
- Performance testing
- Edge case testing (rapid clicks, network issues)
