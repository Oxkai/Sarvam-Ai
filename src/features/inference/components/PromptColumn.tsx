import AccentOrb from '../../../components/ui/AccentOrb';
import Dropdown from '../../../components/ui/Dropdown';
import SegmentedControl from '../../../components/ui/SegmentedControl';
import { COLORS, SPACE } from '../../../constants';
import {
  hueForModel,
  MODELS,
  type InputMode,
} from '../config';
import type { useAudioRecording } from '../hooks/useAudioRecording';
import AudioPromptCard from './AudioPromptCard';
import ExampleChips from './ExampleChips';
import KeyboardHints from './KeyboardHints';
import TextPromptCard from './TextPromptCard';

type Props = {
  inputMode: InputMode;
  onModeChange: (m: InputMode) => void;
  prompt: string;
  onPromptChange: (v: string) => void;
  audio: ReturnType<typeof useAudioRecording>;
  isStreaming: boolean;
  canRun: boolean;
  onRun: () => void;
  onStop: () => void;
  model: string;
  onModelChange: (m: string) => void;
};

/**
 * Left column of the playground. Three zones:
 *   1. Mode selector + model dropdown
 *   2. Prompt surface (text or audio)
 *   3. Contextual hint row (examples / keyboard hints)
 */
export default function PromptColumn({
  inputMode,
  onModeChange,
  prompt,
  onPromptChange,
  audio,
  isStreaming,
  canRun,
  onRun,
  onStop,
  model,
  onModelChange,
}: Props) {
  const hasPrompt = prompt.trim().length > 0;

  return (
    <div
      className="w-full md:w-1/2"
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: COLORS.surface,
        overflow: 'hidden',
        paddingLeft: SPACE[12],
        paddingRight: SPACE[6],
        paddingTop: SPACE[12],
        paddingBottom: SPACE[12],
        gap: SPACE[6],
      }}
    >
      {/* Zone 1 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACE[3],
          minHeight: SPACE[18],
        }}
      >
        <SegmentedControl
          segments={[
            { id: 'text', label: 'Text' },
            { id: 'audio', label: 'Audio' },
          ]}
          activeId={inputMode}
          onChange={(id) => onModeChange(id as InputMode)}
        />
        <Dropdown
          value={model}
          options={MODELS as unknown as { value: string; description?: string }[]}
          onChange={onModelChange}
          size="sm"
          fullWidth={false}
          leading={<AccentOrb hue={hueForModel(model)} size={14} />}
          menuMinWidth={140}
        />
      </div>

      {/* Zone 2 */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {inputMode === 'text' ? (
          <TextPromptCard
            value={prompt}
            onChange={onPromptChange}
            disabled={isStreaming}
            canRun={canRun}
            isStreaming={isStreaming}
            onRun={onRun}
            onStop={onStop}
          />
        ) : (
          <AudioPromptCard
            audio={audio}
            transcript={prompt}
            onTranscriptChange={onPromptChange}
            disabled={isStreaming}
            canRun={canRun}
            isStreaming={isStreaming}
            onRun={onRun}
            onStop={onStop}
          />
        )}
      </div>

      {/* Zone 3 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          minHeight: SPACE[18],
          gap: SPACE[3],
        }}
      >
        {inputMode === 'text' && !hasPrompt && !isStreaming ? (
          <ExampleChips onPick={onPromptChange} />
        ) : (
          <KeyboardHints isStreaming={isStreaming} />
        )}
      </div>
    </div>
  );
}
